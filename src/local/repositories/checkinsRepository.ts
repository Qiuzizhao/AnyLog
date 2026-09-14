import type { CheckinProject, CheckinRecord, CheckinScreenSnapshot, SyncStatus } from '@/src/features/daily/checkins/types';
import { localKeys } from '../keys';
import { getCachedList, setCachedList } from './localListCache';

type CheckinListener = (snapshot: CheckinScreenSnapshot) => void;

const checkinListeners = new Set<CheckinListener>();

export async function listCheckinProjectsLocal() {
  return sortProjects((await readCheckinProjectsLocal()).filter((item) => !item.deleted_at));
}

export async function listCheckinProjectsForSync() {
  return sortProjects(await readCheckinProjectsLocal());
}

export async function listCheckinRecordsLocal() {
  return sortRecords((await readCheckinRecordsLocal()).filter((item) => !item.deleted_at));
}

export async function listCheckinRecordsForSync() {
  return sortRecords(await readCheckinRecordsLocal());
}

export async function listCheckinsLocal(): Promise<CheckinScreenSnapshot> {
  const [projects, records] = await Promise.all([listCheckinProjectsLocal(), listCheckinRecordsLocal()]);
  return { projects, records };
}

export function subscribeCheckinsLocal(listener: CheckinListener) {
  checkinListeners.add(listener);
  return () => {
    checkinListeners.delete(listener);
  };
}

export async function replaceCheckinProjectsFromSync(items: CheckinProject[]) {
  await setCachedList(localKeys.checkinProjects, sortProjects(items.map((item, index) => normalizeProject({ ...item, sync_status: 'synced' }, index))));
  await notifyCheckinsLocal();
}

export async function replaceCheckinRecordsFromSync(items: CheckinRecord[]) {
  await setCachedList(localKeys.checkinRecords, sortRecords(items.map((item, index) => normalizeRecord({ ...item, sync_status: 'synced' }, index))));
  await notifyCheckinsLocal();
}

export async function clearCheckinDataLocal() {
  await Promise.all([
    setCachedList<CheckinProject>(localKeys.checkinProjects, []),
    setCachedList<CheckinRecord>(localKeys.checkinRecords, []),
  ]);
  await notifyCheckinsLocal();
}

export async function createCheckinProjectLocal(payload: Partial<CheckinProject>) {
  const projects = await readCheckinProjectsLocal();
  const now = new Date().toISOString();
  const id = nextLocalId([...projects]);
  const item: CheckinProject = normalizeProject({
    id,
    client_sync_id: `anylog-checkin-project-${id}`,
    title: String(payload.title || '').trim(),
    emoji: payload.emoji || '✓',
    color: payload.color || '#22C55E',
    note: payload.note || null,
    sort_order: typeof payload.sort_order === 'number' ? payload.sort_order : projects.filter((project) => !project.deleted_at).length,
    is_archived: payload.is_archived ? 1 : 0,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  });
  await setCachedList(localKeys.checkinProjects, sortProjects([item, ...projects]));
  await notifyCheckinsLocal();
  return item;
}

export async function updateCheckinProjectLocal(id: number, payload: Partial<CheckinProject>) {
  const projects = await readCheckinProjectsLocal();
  let updated: CheckinProject | null = null;
  const next = sortProjects(projects.map((item) => {
    if (item.id !== id) return item;
    updated = normalizeProject({
      ...item,
      ...payload,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
    });
    return updated;
  }));
  await setCachedList(localKeys.checkinProjects, next);
  await notifyCheckinsLocal();
  return updated;
}

export async function deleteCheckinProjectLocal(id: number) {
  const now = new Date().toISOString();
  const [projects, records] = await Promise.all([readCheckinProjectsLocal(), readCheckinRecordsLocal()]);
  await setCachedList(localKeys.checkinProjects, projects.map((item) => (
    item.id === id ? normalizeProject({ ...item, deleted_at: now, updated_at: now, sync_status: 'pending' }) : item
  )));
  await setCachedList(localKeys.checkinRecords, records.map((item) => (
    item.project_id === id ? normalizeRecord({ ...item, deleted_at: now, updated_at: now, sync_status: 'pending' }) : item
  )));
  await notifyCheckinsLocal();
}

export async function toggleCheckinRecordLocal(project: CheckinProject, date = todayDate()) {
  const records = await listCheckinRecordsLocal();
  const existing = records.find((item) => item.project_id === project.id && item.checkin_date === date);
  if (existing) {
    await deleteCheckinRecordLocal(existing.id);
    return null;
  }

  return createCheckinRecordLocal(project, date);
}

export async function createCheckinRecordLocal(project: CheckinProject, date = todayDate(), payload: Partial<CheckinRecord> = {}) {
  const records = await readCheckinRecordsLocal();
  const existing = records.find((item) => !item.deleted_at && item.project_id === project.id && item.checkin_date === date);
  if (existing) return existing;

  const now = new Date().toISOString();
  const id = nextLocalId([...records]);
  const item: CheckinRecord = normalizeRecord({
    id,
    project_id: project.id,
    project_client_sync_id: project.client_sync_id || `anylog-checkin-project-${project.id}`,
    checkin_date: date,
    checked_at: now,
    note: payload.note || null,
    client_sync_id: `anylog-checkin-record-${id}`,
    created_at: now,
    updated_at: now,
    sync_status: 'pending',
  });
  await setCachedList(localKeys.checkinRecords, sortRecords([item, ...records]));
  await notifyCheckinsLocal();
  return item;
}

export async function deleteCheckinRecordLocal(id: number) {
  const records = await readCheckinRecordsLocal();
  const now = new Date().toISOString();
  await setCachedList(localKeys.checkinRecords, records.map((item) => (
    item.id === id ? normalizeRecord({ ...item, deleted_at: now, updated_at: now, sync_status: 'pending' }) : item
  )));
  await notifyCheckinsLocal();
}

export function todayDate() {
  return localDateKey(new Date());
}

export function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function readCheckinProjectsLocal() {
  const stored = await getCachedList<Partial<CheckinProject>>(localKeys.checkinProjects);
  const normalized = stored.map(normalizeProject);
  if (JSON.stringify(stored) !== JSON.stringify(normalized)) await setCachedList(localKeys.checkinProjects, normalized);
  return normalized;
}

async function readCheckinRecordsLocal() {
  const stored = await getCachedList<Partial<CheckinRecord>>(localKeys.checkinRecords);
  const normalized = stored.map(normalizeRecord);
  if (JSON.stringify(stored) !== JSON.stringify(normalized)) await setCachedList(localKeys.checkinRecords, normalized);
  return normalized;
}

async function notifyCheckinsLocal() {
  const snapshot = await listCheckinsLocal();
  checkinListeners.forEach((listener) => listener(snapshot));
}

function normalizeProject(item: Partial<CheckinProject>, index = 0): CheckinProject {
  const now = new Date().toISOString();
  const id = Number.isFinite(Number(item.id)) ? Number(item.id) : -(index + 1);
  const createdAt = item.created_at || item.updated_at || now;
  return {
    id,
    title: String(item.title || '').trim() || '未命名打卡',
    emoji: item.emoji || '✓',
    color: item.color || '#22C55E',
    note: item.note ?? null,
    sort_order: typeof item.sort_order === 'number' ? item.sort_order : index,
    is_archived: item.is_archived ? 1 : 0,
    client_sync_id: item.client_sync_id || `anylog-checkin-project-${id}`,
    server_revision: item.server_revision,
    created_at: createdAt,
    updated_at: item.updated_at || createdAt,
    deleted_at: item.deleted_at ?? null,
    sync_status: normalizeSyncStatus(item.sync_status),
  };
}

function normalizeRecord(item: Partial<CheckinRecord>, index = 0): CheckinRecord {
  const now = new Date().toISOString();
  const id = Number.isFinite(Number(item.id)) ? Number(item.id) : -(index + 1);
  const projectId = Number.isFinite(Number(item.project_id)) ? Number(item.project_id) : 0;
  const createdAt = item.created_at || item.checked_at || item.updated_at || now;
  return {
    id,
    project_id: projectId,
    project_client_sync_id: item.project_client_sync_id || `anylog-checkin-project-${projectId}`,
    checkin_date: item.checkin_date || localDateKey(new Date(createdAt)),
    checked_at: item.checked_at || createdAt,
    note: item.note ?? null,
    client_sync_id: item.client_sync_id || `anylog-checkin-record-${id}`,
    server_revision: item.server_revision,
    created_at: createdAt,
    updated_at: item.updated_at || createdAt,
    deleted_at: item.deleted_at ?? null,
    sync_status: normalizeSyncStatus(item.sync_status),
  };
}

function normalizeSyncStatus(value: SyncStatus | undefined): SyncStatus {
  if (value === 'synced' || value === 'failed') return value;
  return 'pending';
}

function nextLocalId(items: { id: number }[]) {
  const minId = items.reduce((min, item) => Math.min(min, Number(item.id) || 0), 0);
  return minId <= 0 ? minId - 1 : -1;
}

function sortProjects(items: CheckinProject[]) {
  return [...items].sort((a, b) => {
    const archivedCompare = Number(a.is_archived || 0) - Number(b.is_archived || 0);
    if (archivedCompare !== 0) return archivedCompare;
    const orderCompare = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (orderCompare !== 0) return orderCompare;
    return timestamp(a.created_at) - timestamp(b.created_at);
  });
}

function sortRecords(items: CheckinRecord[]) {
  return [...items].sort((a, b) => {
    const dateCompare = String(b.checkin_date || '').localeCompare(String(a.checkin_date || ''));
    if (dateCompare !== 0) return dateCompare;
    return timestamp(b.checked_at || b.created_at) - timestamp(a.checked_at || a.created_at);
  });
}

function timestamp(value?: string | null) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}
