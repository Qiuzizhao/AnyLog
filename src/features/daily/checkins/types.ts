export type SyncStatus = 'pending' | 'synced' | 'failed';

export type CheckinProject = {
  id: number;
  title: string;
  emoji?: string | null;
  color?: string | null;
  note?: string | null;
  sort_order?: number;
  is_archived?: number;
  client_sync_id?: string | null;
  server_revision?: number;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  sync_status?: SyncStatus;
};

export type CheckinRecord = {
  id: number;
  project_id: number;
  project_client_sync_id?: string | null;
  checkin_date: string;
  checked_at?: string | null;
  note?: string | null;
  client_sync_id?: string | null;
  server_revision?: number;
  created_at?: string;
  updated_at?: string | null;
  deleted_at?: string | null;
  sync_status?: SyncStatus;
};

export type CheckinScreenSnapshot = {
  projects: CheckinProject[];
  records: CheckinRecord[];
};
