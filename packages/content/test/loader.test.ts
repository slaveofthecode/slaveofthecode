import { describe, expect, it } from "bun:test";
import { getContent, parseContent } from "../src/loader";

describe("getContent", () => {
  it("returns validated content for en", () => {
    const content = getContent("en");
    expect(content.profile.name.length).toBeGreaterThan(0);
    expect(Array.isArray(content.experience)).toBe(true);
  });

  it("returns validated content for es", () => {
    const content = getContent("es");
    expect(content.profile.name.length).toBeGreaterThan(0);
  });

  it("throws a readable error for an unknown locale", () => {
    // @ts-expect-error intentionally passing an invalid locale
    expect(() => getContent("de")).toThrow(/Unknown locale "de"/);
  });
});

describe("parseContent", () => {
  it("throws a readable error that names the locale and the failing path", () => {
    const invalid = {
      profile: { name: "Jane" },
      experience: [],
      skills: [],
      languages: [],
      now: [],
    };
    expect(() => parseContent("en", invalid)).toThrow(
      /Invalid content for locale "en"/,
    );
    expect(() => parseContent("en", invalid)).toThrow(/profile\.headline/);
  });
});
