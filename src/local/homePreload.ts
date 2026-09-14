import type { CheckinScreenSnapshot } from '@/src/features/daily/checkins/types';
import { listCheckinsLocal } from './repositories/checkinsRepository';

export const homePreloadKeys = {
  checkins: 'home:checkins',
} as const;

const preloadCache = new Map<string, unknown>();
const preloadPromises = new Map<string, Promise<unknown>>();

export function getPreloadedData<T>(key: string) {
  return preloadCache.get(key) as T | undefined;
}

export function setPreloadedData<T>(key: string, value: T) {
  preloadCache.set(key, value);
}

export function prewarmData<T>(key: string, loader: () => Promise<T>) {
  const existing = preloadPromises.get(key) as Promise<T> | undefined;
  if (existing) return existing;
  const promise = loader()
    .then((value) => {
      setPreloadedData(key, value);
      return value;
    })
    .finally(() => {
      preloadPromises.delete(key);
    });
  preloadPromises.set(key, promise);
  return promise;
}

export function prewarmCheckinScreenData() {
  return prewarmData<CheckinScreenSnapshot>(homePreloadKeys.checkins, () => listCheckinsLocal());
}
