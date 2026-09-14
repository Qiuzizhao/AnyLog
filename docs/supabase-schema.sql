create table if not exists public.anylog_checkin_projects (
  user_id uuid not null references auth.users(id) on delete cascade,
  id bigint not null,
  title text not null,
  emoji text,
  color text,
  note text,
  sort_order integer not null default 0,
  is_archived boolean not null default false,
  client_sync_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create unique index if not exists anylog_checkin_projects_user_client_sync_id_idx
  on public.anylog_checkin_projects(user_id, client_sync_id)
  where client_sync_id is not null;

create table if not exists public.anylog_checkin_records (
  user_id uuid not null references auth.users(id) on delete cascade,
  id bigint not null,
  project_id bigint not null,
  project_client_sync_id text,
  checkin_date date not null,
  checked_at timestamptz,
  note text,
  client_sync_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  primary key (user_id, id)
);

create index if not exists anylog_checkin_records_user_project_idx
  on public.anylog_checkin_records(user_id, project_id);

create unique index if not exists anylog_checkin_records_user_project_date_active_idx
  on public.anylog_checkin_records(user_id, project_id, checkin_date)
  where deleted_at is null;

create table if not exists public.anylog_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_primary_color text not null default '#22C55E',
  updated_at timestamptz not null default now()
);

alter table public.anylog_checkin_projects enable row level security;
alter table public.anylog_checkin_records enable row level security;
alter table public.anylog_settings enable row level security;

drop policy if exists "anylog_checkin_projects owner access" on public.anylog_checkin_projects;
create policy "anylog_checkin_projects owner access"
  on public.anylog_checkin_projects
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "anylog_checkin_records owner access" on public.anylog_checkin_records;
create policy "anylog_checkin_records owner access"
  on public.anylog_checkin_records
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "anylog_settings owner access" on public.anylog_settings;
create policy "anylog_settings owner access"
  on public.anylog_settings
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
