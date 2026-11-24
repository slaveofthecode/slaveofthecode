import { describe, expect, test } from "bun:test";
import type { PersonalProject } from "@portfolio/content";
import {
  PROJECTS_PREVIEW_LIMIT,
  nextVisibleProjectCount,
  sortProjectsByLastCommit,
  splitProjectPreview,
} from "../src/lib/projects";

function project(id: string, lastCommit: string): PersonalProject {
  return {
    id,
    name: id,
    lastCommit,
    description: "A test project.",
    tech: [],
    repoUrl: "https://example.com/repo",
    productionUrl: "https://example.com/app",
    thumbnailUrl: "https://example.com/thumb.png",
  };
}

describe("sortProjectsByLastCommit", () => {
  test("orders projects from newest commit to oldest", () => {
    const items = [
      project("old", "2026-02-03"),
      project("newest", "2026-11-15"),
      project("middle", "2026-09-21"),
    ];

    expect(sortProjectsByLastCommit(items).map((item) => item.id)).toEqual([
      "newest",
      "middle",
      "old",
    ]);
  });

  test("does not mutate the input array", () => {
    const items = [
      project("old", "2026-02-03"),
      project("newest", "2026-11-15"),
    ];

    sortProjectsByLastCommit(items);
    expect(items.map((item) => item.id)).toEqual(["old", "newest"]);
  });

  test("returns an empty array for no projects", () => {
    expect(sortProjectsByLastCommit([])).toEqual([]);
  });
});

describe("splitProjectPreview", () => {
  test("keeps the five newest projects and separates the rest", () => {
    const items = Array.from({ length: 7 }, (_, index) =>
      project(`project-${index}`, `2026-11-0${index + 1}`),
    );

    const { preview, rest } = splitProjectPreview(items);
    expect(preview).toHaveLength(PROJECTS_PREVIEW_LIMIT);
    expect(preview.map((item) => item.id)).toEqual([
      "project-0",
      "project-1",
      "project-2",
      "project-3",
      "project-4",
    ]);
    expect(rest.map((item) => item.id)).toEqual(["project-5", "project-6"]);
  });

  test("has no rest when there are five or fewer projects", () => {
    const items = Array.from({ length: PROJECTS_PREVIEW_LIMIT }, (_, index) =>
      project(`project-${index}`, `2026-11-0${index + 1}`),
    );

    expect(splitProjectPreview(items).rest).toEqual([]);
  });
});

describe("nextVisibleProjectCount", () => {
  test("reveals the next five until the list is exhausted", () => {
    expect(nextVisibleProjectCount(5, 12)).toBe(10);
    expect(nextVisibleProjectCount(10, 12)).toBe(12);
  });

  test("resets to the first five after the last page", () => {
    expect(nextVisibleProjectCount(12, 12)).toBe(5);
    expect(nextVisibleProjectCount(6, 6)).toBe(5);
  });
});
