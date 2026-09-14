import type { CheckinProject, CheckinRecord } from '@/src/features/daily/checkins/types';
import {
  listCheckinProjectsForSync,
  listCheckinRecordsForSync,
  replaceCheckinProjectsFromSync,
  replaceCheckinRecordsFromSync,
} from '@/src/local/repositories/checkinsRepository';
import { getSettingsLocal, saveSettingsFromSync, type AnyLogSettings } from '@/src/local/settingsRepository';
import { getSyncMetadata, saveSyncMetadata } from '@/src/local/syncMetadataRepository';
import { getCurrentSession, getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

type RemoteCheckinProject = {
  id: number;
  user_id: string;
  title: string;
  emoji: string | null;
  color: string | null;
  note: string | null;
  sort_order: number;
  is_archived: boolean;
  client_sync_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RemoteCheckinRecord = {
  id: number;
  user_id: string;
  project_id: number;
  project_client_sync_id: string | null;
  checkin_date: string;
  checked_at: string | null;
  note: string | null;
  client_sync_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type RemoteSettings = {
  user_id: string;
  theme_primary_color: string;
  updated_at: string;
};

export type ManualSyncResult =
  | { status: 'signedOut' }
  | {
      status: 'synced';
      uploadedProjects: number;
      downloadedProjects: number;
      uploadedRecords: number;
      downloadedRecords: number;
      uploadedSettings: boolean;
      downloadedSettings: boolean;
      syncedAt: string;
    };

export async function runManualSync(): Promise<ManualSyncResult> {
  if (!isSupabaseConfigured()) {
    throw new Error('还没有配置 Supabase。请设置 EXPO_PUBLIC_SUPABASE_URL 和 EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY。');
  }

  const session = await getCurrentSession();
  if (!session?.user) return { status: 'signedOut' };

  const supabase = getSupabaseClient();
  const userId = session.user.id;
  const syncedAt = new Date().toISOString();
  const [localProjects, localRecords, localSettings] = await Promise.all([
    listCheckinProjectsForSync(),
    listCheckinRecordsForSync(),
    getSettingsLocal(),
  ]);
  const pendingProjects = localProjects.filter((item) => item.sync_status === 'pending' || item.sync_status === 'failed');
  const pendingRecords = localRecords.filter((item) => item.sync_status === 'pending' || item.sync_status === 'failed');

  if (pendingProjects.length > 0) {
    const { error } = await supabase
      .from('anylog_checkin_projects')
      .upsert(pendingProjects.map((project) => toRemoteProject(project, userId)), { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  if (pendingRecords.length > 0) {
    const { error } = await supabase
      .from('anylog_checkin_records')
      .upsert(pendingRecords.map((record) => toRemoteRecord(record, userId)), { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  const { data: remoteProjectsData, error: remoteProjectsError } = await supabase
    .from('anylog_checkin_projects')
    .select('id,user_id,title,emoji,color,note,sort_order,is_archived,client_sync_id,created_at,updated_at,deleted_at')
    .eq('user_id', userId);
  if (remoteProjectsError) throw remoteProjectsError;

  const { data: remoteRecordsData, error: remoteRecordsError } = await supabase
    .from('anylog_checkin_records')
    .select('id,user_id,project_id,project_client_sync_id,checkin_date,checked_at,note,client_sync_id,created_at,updated_at,deleted_at')
    .eq('user_id', userId);
  if (remoteRecordsError) throw remoteRecordsError;

  const uploadedProjectIds = new Set(pendingProjects.map((item) => item.id));
  const uploadedRecordIds = new Set(pendingRecords.map((item) => item.id));
  const remoteProjects = ((remoteProjectsData ?? []) as RemoteCheckinProject[]).map(toLocalProject);
  const remoteRecords = ((remoteRecordsData ?? []) as RemoteCheckinRecord[]).map(toLocalRecord);

  const mergedProjects = mergeById(
    localProjects.map((item) => ({ ...item, sync_status: uploadedProjectIds.has(item.id) ? 'synced' as const : item.sync_status })),
    remoteProjects,
  ).map((item) => ({ ...item, sync_status: 'synced' as const }));
  const mergedRecords = mergeById(
    localRecords.map((item) => ({ ...item, sync_status: uploadedRecordIds.has(item.id) ? 'synced' as const : item.sync_status })),
    remoteRecords,
  ).map((item) => ({ ...item, sync_status: 'synced' as const }));

  await Promise.all([
    replaceCheckinProjectsFromSync(mergedProjects),
    replaceCheckinRecordsFromSync(mergedRecords),
  ]);

  const { data: remoteSettingsData, error: remoteSettingsError } = await supabase
    .from('anylog_settings')
    .select('user_id,theme_primary_color,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (remoteSettingsError) throw remoteSettingsError;

  const remoteSettings = remoteSettingsData as RemoteSettings | null;
  const shouldUploadSettings = localSettings.sync_status === 'pending' || localSettings.sync_status === 'failed' || !remoteSettings;
  let uploadedSettings = false;

  if (shouldUploadSettings) {
    const { error } = await supabase
      .from('anylog_settings')
      .upsert(toRemoteSettings(localSettings, userId), { onConflict: 'user_id' });
    if (error) throw error;
    uploadedSettings = true;
  }

  const { data: nextRemoteSettingsData, error: nextRemoteSettingsError } = await supabase
    .from('anylog_settings')
    .select('user_id,theme_primary_color,updated_at')
    .eq('user_id', userId)
    .maybeSingle();
  if (nextRemoteSettingsError) throw nextRemoteSettingsError;

  const nextRemoteSettings = nextRemoteSettingsData as RemoteSettings | null;
  const downloadedSettings = Boolean(nextRemoteSettings && timestamp(nextRemoteSettings.updated_at) > timestamp(localSettings.updated_at));
  if (nextRemoteSettings && timestamp(nextRemoteSettings.updated_at) >= timestamp(localSettings.updated_at)) {
    await saveSettingsFromSync({
      theme_primary_color: nextRemoteSettings.theme_primary_color,
      updated_at: nextRemoteSettings.updated_at,
      sync_status: 'synced',
    });
  } else {
    await saveSettingsFromSync(localSettings);
  }

  await saveSyncMetadata({ ...(await getSyncMetadata()), last_synced_at: syncedAt });

  return {
    status: 'synced',
    uploadedProjects: pendingProjects.length,
    downloadedProjects: remoteProjects.length,
    uploadedRecords: pendingRecords.length,
    downloadedRecords: remoteRecords.length,
    uploadedSettings,
    downloadedSettings,
    syncedAt,
  };
}

function toRemoteProject(project: CheckinProject, userId: string): RemoteCheckinProject {
  const createdAt = project.created_at || project.updated_at || new Date().toISOString();
  return {
    id: project.id,
    user_id: userId,
    title: project.title,
    emoji: project.emoji ?? null,
    color: project.color ?? null,
    note: project.note ?? null,
    sort_order: Number(project.sort_order || 0),
    is_archived: Boolean(project.is_archived),
    client_sync_id: project.client_sync_id ?? null,
    created_at: createdAt,
    updated_at: project.updated_at || createdAt,
    deleted_at: project.deleted_at ?? null,
  };
}

function toLocalProject(project: RemoteCheckinProject): CheckinProject {
  return {
    id: project.id,
    title: project.title,
    emoji: project.emoji,
    color: project.color,
    note: project.note,
    sort_order: project.sort_order,
    is_archived: project.is_archived ? 1 : 0,
    client_sync_id: project.client_sync_id,
    created_at: project.created_at,
    updated_at: project.updated_at,
    deleted_at: project.deleted_at,
    sync_status: 'synced',
  };
}

function toRemoteRecord(record: CheckinRecord, userId: string): RemoteCheckinRecord {
  const createdAt = record.created_at || record.checked_at || record.updated_at || new Date().toISOString();
  return {
    id: record.id,
    user_id: userId,
    project_id: record.project_id,
    project_client_sync_id: record.project_client_sync_id ?? null,
    checkin_date: record.checkin_date,
    checked_at: record.checked_at ?? createdAt,
    note: record.note ?? null,
    client_sync_id: record.client_sync_id ?? null,
    created_at: createdAt,
    updated_at: record.updated_at || createdAt,
    deleted_at: record.deleted_at ?? null,
  };
}

function toLocalRecord(record: RemoteCheckinRecord): CheckinRecord {
  return {
    id: record.id,
    project_id: record.project_id,
    project_client_sync_id: record.project_client_sync_id,
    checkin_date: record.checkin_date,
    checked_at: record.checked_at,
    note: record.note,
    client_sync_id: record.client_sync_id,
    created_at: record.created_at,
    updated_at: record.updated_at,
    deleted_at: record.deleted_at,
    sync_status: 'synced',
  };
}

function toRemoteSettings(settings: AnyLogSettings, userId: string): RemoteSettings {
  return {
    user_id: userId,
    theme_primary_color: settings.theme_primary_color,
    updated_at: settings.updated_at || new Date().toISOString(),
  };
}

function mergeById<T extends { id: number; updated_at?: string | null; deleted_at?: string | null }>(localRecords: T[], remoteRecords: T[]) {
  const merged = new Map<number, T>();
  for (const record of localRecords) merged.set(record.id, record);
  for (const remote of remoteRecords) {
    const local = merged.get(remote.id);
    merged.set(remote.id, local ? chooseRecord(local, remote) : remote);
  }
  return [...merged.values()].sort((a, b) => timestamp(b.updated_at || b.deleted_at) - timestamp(a.updated_at || a.deleted_at));
}

function chooseRecord<T extends { updated_at?: string | null; deleted_at?: string | null }>(local: T, remote: T) {
  const localTime = Math.max(timestamp(local.updated_at), timestamp(local.deleted_at));
  const remoteTime = Math.max(timestamp(remote.updated_at), timestamp(remote.deleted_at));
  return remoteTime >= localTime ? remote : local;
}

function timestamp(value?: string | null) {
  if (!value) return 0;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
}
