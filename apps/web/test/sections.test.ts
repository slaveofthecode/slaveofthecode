import { describe, expect, test } from "bun:test";
import { getContent } from "@portfolio/content";
import { hasCvSection, visibleCvSectionIds } from "../src/lib/sections";

describe("section visibility", () => {
  test("empty collections are hidden from sections and navigation", () => {
    const content = {
      ...getContent(),
      experience: [],
      skills: [],
      languages: [],
      education: [],
      certifications: [],
      now: [],
      personalProjects: [],
    };

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
    const content = getContent();
    expect(hasCvSection(content, "now")).toBe(true);
    expect(hasCvSection(content, "projects")).toBe(true);
    expect(visibleCvSectionIds(content)).toContain("skills");
  });
});
