#!/usr/bin/env python3
import sqlite3
import subprocess
from pathlib import Path

TARGET_EMAIL = "631911727@qq.com"
SUPABASE_PROJECT_DIR = Path("/opt/notes-supabase")
SUPERME_DB = Path("/home/ubuntu/SuperMe/backend/data/superme.db")
IMPORT_SQL = Path("/tmp/anylog-import.sql")


def fix_text(value):
    if value is None:
        return None
    text = str(value)
    try:
        decoded = text.encode("latin1").decode("utf-8")
    except UnicodeError:
        return text
    if decoded != text and any(ord(char) > 127 for char in decoded):
        return decoded
    return text


def sql(value):
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    text = fix_text(value)
    return "'" + text.replace("'", "''") + "'"


def values_clause(rows, columns):
    if not rows:
        return ""
    lines = []
    for row in rows:
        lines.append("(" + ", ".join(sql(row[column]) for column in columns) + ")")
    return ",\n".join(lines)


def main():
    conn = sqlite3.connect(SUPERME_DB)
    conn.row_factory = sqlite3.Row

    projects = conn.execute(
        """
        select id, title, emoji, color, note, sort_order, is_archived, client_sync_id,
               created_at, updated_at
        from checkin_projects
        order by sort_order, id
        """
    ).fetchall()
    records = conn.execute(
        """
        select id, project_id, project_client_sync_id, checkin_date, checked_at, note,
               client_sync_id, created_at, updated_at
        from checkin_records
        order by checkin_date, id
        """
    ).fetchall()

    project_columns = [
        "id",
        "title",
        "emoji",
        "color",
        "note",
        "sort_order",
        "is_archived",
        "client_sync_id",
        "created_at",
        "updated_at",
    ]
    record_columns = [
        "id",
        "project_id",
        "project_client_sync_id",
        "checkin_date",
        "checked_at",
        "note",
        "client_sync_id",
        "created_at",
        "updated_at",
    ]

    statements = [
        "\\set ON_ERROR_STOP on",
        "begin;",
        f"select id as target_user_id from auth.users where email = {sql(TARGET_EMAIL)};",
    ]

    if projects:
        statements.append(
            f"""
with target_user as (
  select id as user_id from auth.users where email = {sql(TARGET_EMAIL)}
),
source(id,title,emoji,color,note,sort_order,is_archived,client_sync_id,created_at,updated_at) as (
  values
{values_clause(projects, project_columns)}
)
insert into public.anylog_checkin_projects (
  user_id,id,title,emoji,color,note,sort_order,is_archived,client_sync_id,created_at,updated_at,deleted_at
)
select
  target_user.user_id,
  source.id,
  source.title,
  source.emoji,
  source.color,
  source.note,
  coalesce(source.sort_order, 0),
  coalesce(source.is_archived, 0)::integer <> 0,
  coalesce(source.client_sync_id, 'superme-checkin-project-' || source.id::text),
  coalesce(source.created_at::timestamptz, now()),
  coalesce(source.updated_at::timestamptz, source.created_at::timestamptz, now()),
  null
from source cross join target_user
on conflict (user_id, id) do update set
  title = excluded.title,
  emoji = excluded.emoji,
  color = excluded.color,
  note = excluded.note,
  sort_order = excluded.sort_order,
  is_archived = excluded.is_archived,
  client_sync_id = excluded.client_sync_id,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  deleted_at = null;
"""
        )

    if records:
        statements.append(
            f"""
with target_user as (
  select id as user_id from auth.users where email = {sql(TARGET_EMAIL)}
),
source(id,project_id,project_client_sync_id,checkin_date,checked_at,note,client_sync_id,created_at,updated_at) as (
  values
{values_clause(records, record_columns)}
)
insert into public.anylog_checkin_records (
  user_id,id,project_id,project_client_sync_id,checkin_date,checked_at,note,client_sync_id,created_at,updated_at,deleted_at
)
select
  target_user.user_id,
  source.id,
  source.project_id,
  coalesce(source.project_client_sync_id, 'superme-checkin-project-' || source.project_id::text),
  source.checkin_date::date,
  coalesce(source.checked_at::timestamptz, source.created_at::timestamptz, now()),
  source.note,
  coalesce(source.client_sync_id, 'superme-checkin-record-' || source.id::text),
  coalesce(source.created_at::timestamptz, source.checked_at::timestamptz, now()),
  coalesce(source.updated_at::timestamptz, source.checked_at::timestamptz, source.created_at::timestamptz, now()),
  null
from source cross join target_user
on conflict (user_id, id) do update set
  project_id = excluded.project_id,
  project_client_sync_id = excluded.project_client_sync_id,
  checkin_date = excluded.checkin_date,
  checked_at = excluded.checked_at,
  note = excluded.note,
  client_sync_id = excluded.client_sync_id,
  created_at = excluded.created_at,
  updated_at = excluded.updated_at,
  deleted_at = null;
"""
        )

    statements.append(
        f"""
insert into public.anylog_settings (user_id, theme_primary_color, updated_at)
select id, '#22C55E', now()
from auth.users
where email = {sql(TARGET_EMAIL)}
on conflict (user_id) do update set
  theme_primary_color = excluded.theme_primary_color,
  updated_at = excluded.updated_at;
"""
    )
    statements.extend(
        [
            "commit;",
            """
select
  (select count(*) from public.anylog_checkin_projects p join auth.users u on u.id = p.user_id where u.email = '631911727@qq.com') as projects,
  (select count(*) from public.anylog_checkin_records r join auth.users u on u.id = r.user_id where u.email = '631911727@qq.com') as records;
""",
        ]
    )

    IMPORT_SQL.write_text("\n".join(statements), encoding="utf-8")
    subprocess.run(
        ["docker", "compose", "exec", "-T", "db", "psql", "-U", "postgres", "-d", "postgres"],
        cwd=SUPABASE_PROJECT_DIR,
        stdin=IMPORT_SQL.open("rb"),
        check=True,
    )
    print(f"Imported {len(projects)} SuperMe projects and {len(records)} records into AnyLog for {TARGET_EMAIL}.")


if __name__ == "__main__":
    main()
