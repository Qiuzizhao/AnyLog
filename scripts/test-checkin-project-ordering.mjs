import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const sourcePath = 'src/features/daily/checkins/projectOrdering.ts';
assert.ok(fs.existsSync(sourcePath), `${sourcePath} should exist`);

const source = fs.readFileSync(sourcePath, 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020,
    esModuleInterop: true,
  },
}).outputText;

const module = { exports: {} };
vm.runInNewContext(compiled, { exports: module.exports, module }, { filename: sourcePath });

const { preserveProjectOrder, sortProjectsByUsage } = module.exports;
assert.equal(typeof preserveProjectOrder, 'function', 'preserveProjectOrder should be exported.');
assert.equal(typeof sortProjectsByUsage, 'function', 'sortProjectsByUsage should be exported.');

const projects = [
  { id: 1, title: '低频', is_archived: 0 },
  { id: 2, title: '高频', is_archived: 0 },
  { id: 3, title: '中频', is_archived: 0 },
];
const records = [
  { id: 1, project_id: 2 },
  { id: 2, project_id: 2 },
  { id: 3, project_id: 3 },
];

assert.deepEqual(
  [...sortProjectsByUsage(projects, records).map((project) => project.id)],
  [2, 3, 1],
  'fresh load should sort projects by usage count.',
);

const sessionOrder = [3, 2, 1];
const recordsAfterCheckin = [
  ...records,
  { id: 4, project_id: 1 },
  { id: 5, project_id: 1 },
  { id: 6, project_id: 1 },
];

assert.deepEqual(
  [...preserveProjectOrder(projects, recordsAfterCheckin, sessionOrder).map((project) => project.id)],
  [3, 2, 1],
  'checking in should not immediately move an existing card during the current session.',
);

const withNewProject = [...projects, { id: 4, title: '新项目', is_archived: 0 }];
assert.deepEqual(
  [...preserveProjectOrder(withNewProject, recordsAfterCheckin, sessionOrder).map((project) => project.id)],
  [3, 2, 1, 4],
  'new projects should be appended without disturbing the current visible order.',
);

console.log('Check-in project ordering behavior verified.');
