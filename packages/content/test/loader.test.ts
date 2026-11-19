import { describe, expect, it } from "bun:test";
import { getContent, parseContent } from "../src/loader";

describe("getContent", () => {
  it("returns validated content from the committed JSON", () => {
    const content = getContent();
    expect(content.profile.name.length).toBeGreaterThan(0);
    expect(content.profile.avatar).toMatch(/^https:\/\//);
    expect(Array.isArray(content.experience)).toBe(true);
    expect(content.personalProjects.length).toBeGreaterThan(0);
  });
});

describe("parseContent", () => {
  it("throws a readable error that names the failing path", () => {
    const invalid = {
      profile: { name: "Jane" },
      experience: [],
      skills: [],
      languages: [],
      now: [],
    };
    expect(() => parseContent(invalid)).toThrow(/Invalid CV content/);
    expect(() => parseContent(invalid)).toThrow(/profile\.headline/);
  });
});
