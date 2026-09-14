import type { SyncStatus } from '@/src/features/daily/checkins/types';
import { localKeys } from './keys';
import { getJson, setJson } from './storage';

export type AnyLogSettings = {
  theme_primary_color: string;
  updated_at: string;
  sync_status: SyncStatus;
};

export const defaultThemePrimaryColor = '#22C55E';

export function normalizeAnyLogSettings(value?: Partial<AnyLogSettings> | null): AnyLogSettings {
  return {
    theme_primary_color: value?.theme_primary_color || defaultThemePrimaryColor,
    updated_at: value?.updated_at || new Date().toISOString(),
    sync_status: value?.sync_status === 'synced' || value?.sync_status === 'failed' ? value.sync_status : 'pending',
  };
}

export async function getSettingsLocal() {
  return normalizeAnyLogSettings(await getJson<Partial<AnyLogSettings>>(localKeys.settings, normalizeAnyLogSettings()));
}

export async function saveSettingsLocal(settings: Partial<AnyLogSettings>) {
  const nextSettings = normalizeAnyLogSettings({
    ...(await getSettingsLocal()),
    ...settings,
    updated_at: new Date().toISOString(),
    sync_status: 'pending',
  });
  await setJson(localKeys.settings, nextSettings);
  return nextSettings;
}

export async function saveSettingsFromSync(settings: Partial<AnyLogSettings>) {
  const nextSettings = {
    ...normalizeAnyLogSettings(settings),
    sync_status: 'synced' as const,
  };
  await setJson(localKeys.settings, nextSettings);
  return nextSettings;
}

export async function resetSettingsLocal() {
  const nextSettings = normalizeAnyLogSettings({
    theme_primary_color: defaultThemePrimaryColor,
    sync_status: 'synced',
  });
  await setJson(localKeys.settings, nextSettings);
  return nextSettings;
}
