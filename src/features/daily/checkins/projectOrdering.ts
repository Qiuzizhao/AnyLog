import type { CheckinProject, CheckinRecord } from './types';

export function sortProjectsByUsage(projects: CheckinProject[], records: CheckinRecord[]) {
  return projects
    .map((project, index) => ({
      project,
      index,
      count: countCheckinRecordsForProject(project, records),
    }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.index - b.index;
    })
    .map((item) => item.project);
}

export function preserveProjectOrder(
  projects: CheckinProject[],
  records: CheckinRecord[],
  visibleProjectIds: number[],
) {
  const byId = new Map(projects.map((project) => [project.id, project]));
  const kept = visibleProjectIds.flatMap((id) => {
    const project = byId.get(id);
    return project ? [project] : [];
  });
  const knownIds = new Set(kept.map((project) => project.id));
  const added = sortProjectsByUsage(projects.filter((project) => !knownIds.has(project.id)), records);
  return [...kept, ...added];
}

function countCheckinRecordsForProject(project: CheckinProject, records: CheckinRecord[]) {
  return records.filter((record) => record.project_id === project.id).length;
}
