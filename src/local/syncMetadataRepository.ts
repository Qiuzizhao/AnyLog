import { localKeys } from './keys';
import { getJson, setJson } from './storage';

export type SyncMetadata = {
  last_synced_at: string | null;
};

const defaultSyncMetadata: SyncMetadata = { last_synced_at: null };

export async function getSyncMetadata() {
  return getJson<SyncMetadata>(localKeys.meta, defaultSyncMetadata);
}

export async function saveSyncMetadata(metadata: SyncMetadata) {
  await setJson(localKeys.meta, metadata);
}

export async function clearSyncMetadata() {
  await setJson(localKeys.meta, defaultSyncMetadata);
  return defaultSyncMetadata;
}
