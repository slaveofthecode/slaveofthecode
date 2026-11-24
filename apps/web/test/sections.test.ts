import { describe, expect, test } from "bun:test";
import { getContent, parseContent } from "@portfolio/content";
import {
  defaultCvSectionId,
  hasCvSection,
  visibleCvSectionIds,
} from "../src/lib/sections";

const profile = getContent().profile;

const withData = parseContent({
  profile,
  now: [
    {
      id: "now-test",
      kind: "course",
      title: "Test course",
      description: "A short test description.",
      pdfDescription: "A short PDF description.",
      progress: 21,
      status: "in-progress",
      updatedAt: "2026-11-01",
      links: [],
      tags: [],
    },
  ],
  personalProjects: [
    {
      id: "project-test",
      name: "Test project",
      lastCommit: "2026-11-01",
      description: "A short test project.",
      tech: [],
      repoUrl: "https://example.com/repo",
      productionUrl: "https://example.com/app",
      thumbnailUrl: "https://example.com/thumb.png",
    },
  ],
});

describe("section visibility", () => {
  test("empty collections are hidden from sections and navigation", () => {
    const content = parseContent({ profile });

    expect(visibleCvSectionIds(content)).toEqual([]);
    for (const id of [
      "experience",
      "skills",
      "languages",
      "education",
      "certifications",
      "now",
      "projects",
    ] as const) {
      expect(hasCvSection(content, id)).toBe(false);
    }
  });

  test("collections with data stay visible", () => {
    expect(hasCvSection(withData, "now")).toBe(true);
    expect(hasCvSection(withData, "projects")).toBe(true);
    expect(visibleCvSectionIds(withData)).toEqual(["now", "projects"]);
  });

  test("experience is the default section when data exists", () => {
    expect(defaultCvSectionId(getContent())).toBe("experience");
    expect(defaultCvSectionId(parseContent({ profile }))).toBe("");
  });
});
