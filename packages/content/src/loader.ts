import type { ZodError } from "zod";
import { type Content, contentSchema } from "./schemas";

import enCertifications from "../data/en/certifications.json";
import enEducation from "../data/en/education.json";
import enExperience from "../data/en/experience.json";
import enLanguages from "../data/en/languages.json";
import enNow from "../data/en/now.json";
import enProfile from "../data/en/profile.json";
import enSkills from "../data/en/skills.json";
import esCertifications from "../data/es/certifications.json";
import esEducation from "../data/es/education.json";
import esExperience from "../data/es/experience.json";
import esLanguages from "../data/es/languages.json";
import esNow from "../data/es/now.json";
import esProfile from "../data/es/profile.json";
import esSkills from "../data/es/skills.json";

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * All CV data, imported statically (no `fs`) so the same code runs under Bun,
 * Vite/Astro and a Lambda bundle.
 */
const DATA: Record<Locale, unknown> = {
  en: {
    profile: enProfile,
    experience: enExperience,
    skills: enSkills,
    languages: enLanguages,
    education: enEducation,
    certifications: enCertifications,
    now: enNow,
  },
  es: {
    profile: esProfile,
    experience: esExperience,
    skills: esSkills,
    languages: esLanguages,
    education: esEducation,
    certifications: esCertifications,
    now: esNow,
  },
};

function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/** Validate raw data for a locale and throw a readable error on failure. */
export function parseContent(locale: Locale, raw: unknown): Content {
  const result = contentSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(
      `Invalid content for locale "${locale}":\n${formatIssues(result.error)}`,
    );
  }
  return result.data;
}

/** The validated CV content for a locale. Throws a readable error if invalid. */
export function getContent(locale: Locale): Content {
  const raw = DATA[locale];
  if (raw === undefined) {
    throw new Error(
      `Unknown locale "${locale}". Available locales: ${LOCALES.join(", ")}`,
    );
  }
  return parseContent(locale, raw);
}
