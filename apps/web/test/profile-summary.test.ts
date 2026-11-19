import { describe, expect, test } from "bun:test";
import { getContent } from "@portfolio/content";
import {
  plainProfileSummary,
  profileSummary,
} from "../src/lib/profile-summary";

const profile = getContent().profile;

describe("profileSummary", () => {
  test("prepends the profile highlights with Markdown", () => {
    const summary = profileSummary(profile);

    expect(
      summary.startsWith(`**${profile.yearsOfExperience}**  of experience`),
    ).toBe(true);
    expect(summary).toContain(`English level: **${profile.englishLevel}**`);
    expect(summary).toContain(profile.summary.trim());
  });

  test("plainProfileSummary strips Markdown markers", () => {
    const plain = plainProfileSummary(profile);

    expect(plain).toContain(`${profile.yearsOfExperience} of experience`);
    expect(plain).toContain(`English level: ${profile.englishLevel}`);
    expect(plain).not.toContain("**");
    expect(plain).not.toContain("_");
  });
});
