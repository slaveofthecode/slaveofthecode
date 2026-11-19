import type { Profile } from "@portfolio/content";
import { strings as t } from "./strings";

export function profileSummary(profile: Profile): string {
  return [
    `**${profile.yearsOfExperience}**  ${t.cv.ofExperience}`,
    `${t.cv.englishLevel}: **${profile.englishLevel}**`,
    profile.summary.trim(),
  ].join("\n");
}

export function plainProfileSummary(profile: Profile): string {
  return profileSummary(profile)
    .replace(/[*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
