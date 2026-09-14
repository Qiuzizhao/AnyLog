import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { createClient } from '@supabase/supabase-js';

const targetEmail = '631911727@qq.com';
const supermeApiBase = process.env.SUPERME_API_BASE || 'http://127.0.0.1:8000/api';
const supermeToken = process.env.SUPERME_AUTH_TOKEN || '';
const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Set SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before importing.');
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function main() {
  const userId = await findUserIdByEmail(targetEmail);
  const snapshot = await loadSuperMeSnapshot();
  const now = new Date().toISOString();

  const projects = snapshot.projects.map((project, index) => ({
    user_id: userId,
    id: Number(project.id),
    title: String(project.title || '未命名打卡'),
    emoji: project.emoji || '✓',
    color: project.color || '#22C55E',
    note: project.note || null,
    sort_order: Number.isFinite(Number(project.sort_order)) ? Number(project.sort_order) : index,
    is_archived: Boolean(project.is_archived),
    client_sync_id: project.client_sync_id || `superme-checkin-project-${project.id}`,
    created_at: project.created_at || project.updated_at || now,
    updated_at: project.updated_at || project.created_at || now,
    deleted_at: project.deleted_at || null,
  }));

  const records = snapshot.records.map((record) => ({
    user_id: userId,
    id: Number(record.id),
    project_id: Number(record.project_id),
    project_client_sync_id: record.project_client_sync_id || `superme-checkin-project-${record.project_id}`,
    checkin_date: record.checkin_date,
    checked_at: record.checked_at || record.created_at || now,
    note: record.note || null,
    client_sync_id: record.client_sync_id || `superme-checkin-record-${record.id}`,
    created_at: record.created_at || record.checked_at || now,
    updated_at: record.updated_at || record.checked_at || record.created_at || now,
    deleted_at: record.deleted_at || null,
  }));

  if (projects.length > 0) {
    const { error } = await supabase
      .from('anylog_checkin_projects')
      .upsert(projects, { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  if (records.length > 0) {
    const { error } = await supabase
      .from('anylog_checkin_records')
      .upsert(records, { onConflict: 'user_id,id' });
    if (error) throw error;
  }

  const { error: settingsError } = await supabase
    .from('anylog_settings')
    .upsert({ user_id: userId, theme_primary_color: '#22C55E', updated_at: now }, { onConflict: 'user_id' });
  if (settingsError) throw settingsError;

  console.log(`Imported ${projects.length} projects and ${records.length} records for ${targetEmail}.`);
}

async function findUserIdByEmail(email) {
  const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;
  const user = data.users.find((item) => item.email?.toLowerCase() === email.toLowerCase());
  if (!user) throw new Error(`No Supabase auth user found for ${email}.`);
  return user.id;
}

async function loadSuperMeSnapshot() {
  const fixturePath = process.env.SUPERME_CHECKINS_JSON;
  if (fixturePath) {
    const raw = JSON.parse(fs.readFileSync(path.resolve(fixturePath), 'utf8'));
    return {
      projects: Array.isArray(raw.projects) ? raw.projects : [],
      records: Array.isArray(raw.records) ? raw.records : [],
    };
  }

  if (!supermeToken) {
    throw new Error('Set SUPERME_AUTH_TOKEN or SUPERME_CHECKINS_JSON to load SuperMe check-in data.');
  }

  const [projects, records] = await Promise.all([
    fetchSuperMeList('/checkins/projects/'),
    fetchSuperMeList('/checkins/records/'),
  ]);
  return { projects, records };
}

async function fetchSuperMeList(endpoint) {
  const response = await fetch(`${supermeApiBase}${endpoint}`, {
    headers: { Authorization: `Bearer ${supermeToken}` },
  });
  if (!response.ok) throw new Error(`SuperMe API ${endpoint} failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  return Array.isArray(data) ? data : data.results || data.items || [];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
