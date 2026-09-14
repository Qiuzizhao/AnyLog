import { clearCheckinDataLocal, listCheckinRecordsLocal } from './repositories/checkinsRepository';
import { getSettingsLocal, resetSettingsLocal, type AnyLogSettings } from './settingsRepository';
import { clearSyncMetadata, getSyncMetadata, type SyncMetadata } from './syncMetadataRepository';

export type LocalMergeSummary = {
  shouldConfirm: boolean;
  checkinCount: number;
  hasSettingsChanges: boolean;
};

export function buildLocalMergeSummary(
  checkinRecords: Awaited<ReturnType<typeof listCheckinRecordsLocal>>,
  settings: AnyLogSettings,
  metadata: SyncMetadata
): LocalMergeSummary {
  const checkinCount = checkinRecords.filter((record) => !record.deleted_at).length;
  const hasSettingsChanges = settings.sync_status === 'pending' || settings.sync_status === 'failed';
  return {
    shouldConfirm: !metadata.last_synced_at && (checkinCount > 0 || hasSettingsChanges),
    checkinCount,
    hasSettingsChanges,
  };
}

export async function getLocalMergeSummary() {
  const [records, settings, metadata] = await Promise.all([listCheckinRecordsLocal(), getSettingsLocal(), getSyncMetadata()]);
  return buildLocalMergeSummary(records, settings, metadata);
}

export async function clearAccountLocalData() {
  const [, settings, metadata] = await Promise.all([
    clearCheckinDataLocal(),
    resetSettingsLocal(),
    clearSyncMetadata(),
  ]);
  return { settings, metadata };
}
