import assert from 'node:assert/strict';
import fs from 'node:fs';

function read(path) {
  assert.ok(fs.existsSync(path), `${path} should exist`);
  return fs.readFileSync(path, 'utf8');
}

const requiredFiles = [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/auth.tsx',
  'app/settings/index.tsx',
  'app/daily/checkin-detail.tsx',
  'app/daily/checkin-project-edit.tsx',
  'src/features/daily/checkins/CheckinScreen.tsx',
  'src/features/daily/checkins/CheckinDetailScreen.tsx',
  'src/features/daily/checkins/CheckinProjectEditorScreen.tsx',
  'src/features/daily/checkins/CheckinHeatmapCard.tsx',
  'src/local/repositories/checkinsRepository.ts',
  'src/sync/manualSync.ts',
  'src/sync/supabaseClient.ts',
  'docs/supabase-schema.sql',
  'scripts/import-superme-checkins.mjs',
];

for (const file of requiredFiles) read(file);

const home = read('src/features/daily/checkins/CheckinScreen.tsx');
assert.match(home, /title="打卡"/, 'home screen should preserve the SuperMe check-in title.');
assert.match(home, /settings-outline/, 'home header should keep a top-left settings button.');
assert.match(home, /sync-outline/, 'home header should keep a top-right sync button.');
assert.match(home, /name="add"/, 'home header should keep a create-project action.');
assert.match(home, /runManualSync/, 'home screen should call manual sync.');
assert.match(home, /项目卡片/, 'home screen should preserve the project-card section.');
assert.match(home, /热力图/, 'home screen should preserve the heatmap section.');
assert.doesNotMatch(home, /今日打卡/, 'home screen should not restore the removed SuperMe daily hero card.');

const repository = read('src/local/repositories/checkinsRepository.ts');
assert.match(repository, /listCheckinProjectsForSync/, 'repository should expose projects for manual sync.');
assert.match(repository, /replaceCheckinRecordsFromSync/, 'repository should replace records after sync.');
assert.doesNotMatch(repository, /enqueueOperation|syncQueue/, 'standalone repository should not use the SuperMe sync queue.');
assert.match(repository, /localDateKey\(new Date\(\)\)/, 'repository should use local date keys for today.');

const sync = read('src/sync/manualSync.ts');
assert.match(sync, /from\('anylog_checkin_projects'\)/, 'manual sync should use the AnyLog check-in projects table.');
assert.match(sync, /from\('anylog_checkin_records'\)/, 'manual sync should use the AnyLog check-in records table.');
assert.match(sync, /from\('anylog_settings'\)/, 'manual sync should use the AnyLog settings table.');

const schema = read('docs/supabase-schema.sql');
assert.match(schema, /public\.anylog_checkin_projects/, 'schema should define anylog_checkin_projects.');
assert.match(schema, /public\.anylog_checkin_records/, 'schema should define anylog_checkin_records.');
assert.match(schema, /public\.anylog_settings/, 'schema should define anylog_settings.');

const importScript = read('scripts/import-superme-checkins.mjs');
assert.match(importScript, /631911727@qq\.com/, 'import script should target the requested account.');
assert.match(importScript, /anylog_checkin_projects/, 'import script should write AnyLog project rows.');
assert.match(importScript, /anylog_checkin_records/, 'import script should write AnyLog record rows.');

console.log('AnyLog standalone check-in structure verified.');
