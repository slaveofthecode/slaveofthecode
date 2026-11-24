import { describe, expect, test } from "bun:test";
import { getContent, parseContent } from "@portfolio/content";
import { buildChunks, cosineSimilarity } from "../src/domain/rag";
import { profileHit } from "./helpers";

describe("cosineSimilarity", () => {
  test("is 1 for identical vectors and 0 for orthogonal ones", () => {
    expect(cosineSimilarity([1, 0], [1, 0])).toBeCloseTo(1);
    expect(cosineSimilarity([1, 0], [0, 1])).toBe(0);
  });

  test("handles zero vectors safely", () => {
    expect(cosineSimilarity([0, 0], [1, 2])).toBe(0);
  });
});

describe("buildChunks", () => {
  const content = parseContent({
    ...getContent(),
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
  const chunks = buildChunks(content);

  test("covers every CV collection including now", () => {
    const sections = new Set(chunks.map((chunk) => chunk.section));
    expect(chunks.length).toBeGreaterThan(5);
    expect(sections).toContain("profile");
    expect(sections).toContain("experience");
    expect(sections).toContain("skills");
    expect(sections).toContain("now");
    expect(sections).toContain("personal-projects");
  });

  test("the profile chunk includes experience and English level", () => {
    const profile = chunks.find((chunk) => chunk.id === "profile");
    expect(profile?.content).toContain(
      `Experience: ${content.profile.yearsOfExperience}`,
    );
    expect(profile?.content).toContain(
      `English level: ${content.profile.englishLevel}`,
    );
  });

  test("experience chunks keep tech with each project", () => {
    const chunk = chunks.find(
      (chunk) => chunk.id === "experience:nybble-group",
    );
    expect(chunk?.content).toContain(
      "Tech: Meteor, Node.js, Blaze, MongoDB, GitHub Actions",
    );
    expect(chunk?.content).toContain(
      "Tech: Java, Spring Boot, Camunda, Azure OCR, AWS",
    );
  });

  test("every chunk carries id, section, title and content", () => {
    for (const chunk of chunks) {
      expect(chunk.id.length).toBeGreaterThan(0);
      expect(chunk.section.length).toBeGreaterThan(0);
      expect(chunk.title.length).toBeGreaterThan(0);
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });

  test("produces distinct ids", () => {
    const ids = new Set(chunks.map((chunk) => chunk.id));
    expect(ids.size).toBe(chunks.length);
  });
});

describe("FakeStore grounding", () => {
  test("exposes a profile chunk", () => {
    expect(profileHit().id).toBe("profile");
  });
});
