import { describe, expect, it } from "bun:test";

import enEducation from "../data/en/education.json";
import enExperience from "../data/en/experience.json";
import enLanguages from "../data/en/languages.json";
import enNow from "../data/en/now.json";
import enProfile from "../data/en/profile.json";
import enSkills from "../data/en/skills.json";
import esEducation from "../data/es/education.json";
import esExperience from "../data/es/experience.json";
import esLanguages from "../data/es/languages.json";
import esNow from "../data/es/now.json";
import esProfile from "../data/es/profile.json";
import esSkills from "../data/es/skills.json";

type Row = Record<string, unknown>;
type Collection = "experience" | "skills" | "languages" | "education" | "now";

const en: Record<Collection, Row[]> = {
  experience: enExperience as unknown as Row[],
  skills: enSkills as unknown as Row[],
  languages: enLanguages as unknown as Row[],
  education: enEducation as unknown as Row[],
  now: enNow as unknown as Row[],
};

const es: Record<Collection, Row[]> = {
  experience: esExperience as unknown as Row[],
  skills: esSkills as unknown as Row[],
  languages: esLanguages as unknown as Row[],
  education: esEducation as unknown as Row[],
  now: esNow as unknown as Row[],
};

const collections: Collection[] = [
  "experience",
  "skills",
  "languages",
  "education",
  "now",
];

/** Text fields that are allowed to differ between locales. */
const TEXT_FIELDS: Record<Collection, string[]> = {
  experience: ["company", "role", "location", "summary", "highlights"],
  skills: ["name", "items"],
  languages: ["name", "level"],
  education: ["institution", "title"],
  now: ["title", "description", "tags"],
};

function stripText(collection: Collection, row: Row): Row {
  const clone = structuredClone(row) as Row;
  for (const field of TEXT_FIELDS[collection]) delete clone[field];
  const links = clone.links;
  if (Array.isArray(links)) {
    clone.links = links.map((link) => ({ url: (link as Row).url }));
  }
  return clone;
}

describe("en/es parity", () => {
  it("has the same ids in the same order", () => {
    for (const name of collections) {
      expect(en[name].map((row) => row.id)).toEqual(
        es[name].map((row) => row.id),
      );
    }
  });

  it("has identical key sets per item (no missing or extra keys)", () => {
    for (const name of collections) {
      en[name].forEach((row, index) => {
        expect(Object.keys(row).sort()).toEqual(
          Object.keys(es[name][index] ?? {}).sort(),
        );
      });
    }
  });

  it("shares all non-text fields (dates, urls, progress, status, tech, tags)", () => {
    for (const name of collections) {
      en[name].forEach((row, index) => {
        expect(stripText(name, row)).toEqual(
          stripText(name, es[name][index] ?? {}),
        );
      });
    }
  });

  it("profile shares non-text fields (link urls, email)", () => {
    const enP = enProfile as unknown as Row;
    const esP = esProfile as unknown as Row;
    const enLinks = (enP.links as Row[]).map((link) => link.url);
    const esLinks = (esP.links as Row[]).map((link) => link.url);
    expect(enLinks).toEqual(esLinks);
    expect(enP.email ?? null).toEqual(esP.email ?? null);
  });
});
