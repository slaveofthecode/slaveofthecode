import type { PersonalProject } from "@portfolio/content";

export const PROJECTS_PREVIEW_LIMIT = 5;

export function splitProjectPreview(items: readonly PersonalProject[]) {
  return {
    preview: items.slice(0, PROJECTS_PREVIEW_LIMIT),
    rest: items.slice(PROJECTS_PREVIEW_LIMIT),
  };
}

export function nextVisibleProjectCount(
  current: number,
  total: number,
): number {
  if (current >= total) return Math.min(PROJECTS_PREVIEW_LIMIT, total);
  return Math.min(current + PROJECTS_PREVIEW_LIMIT, total);
}

export function sortProjectsByLastCommit(
  items: readonly PersonalProject[],
): PersonalProject[] {
  return [...items].sort((a, b) => b.lastCommit.localeCompare(a.lastCommit));
}
