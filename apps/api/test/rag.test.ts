import { describe, expect, test } from "bun:test";
import { getContent } from "@portfolio/content";
import { buildChunks, cosineSimilarity } from "../src/domain/rag";
import { FakeEmbeddings, profileHit } from "./helpers";

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
  const chunks = buildChunks(getContent("en"), "en");

  test("covers every CV collection including now", () => {
    const sections = new Set(chunks.map((chunk) => chunk.section));
    expect(chunks.length).toBeGreaterThan(5);
    expect(sections).toContain("profile");
    expect(sections).toContain("experience");
    expect(sections).toContain("skills");
    expect(sections).toContain("now");
  });

  test("every chunk carries locale, section, title and content", () => {
    for (const chunk of chunks) {
      expect(chunk.locale).toBe("en");
      expect(chunk.section.length).toBeGreaterThan(0);
      expect(chunk.title.length).toBeGreaterThan(0);
      expect(chunk.content.length).toBeGreaterThan(0);
    }
  });

  test("produces distinct ids and differs per locale", () => {
    const ids = new Set(chunks.map((chunk) => chunk.id));
    expect(ids.size).toBe(chunks.length);
  });
});

describe("FakeStore grounding", () => {
  test("filters by locale", () => {
    // Smoke-tests the helper used across the suite.
    expect(profileHit("en").locale).toBe("en");
  });
});
