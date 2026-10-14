import { type Strings, en } from "./en";
import { es } from "./es";

export const languages: Record<Locale, Strings> = { en, es };

export const defaultLocale = "en" as const;
export const locales = ["en", "es"] as const;
export type Locale = (typeof locales)[number];

/** UI strings for a locale. */
export function getStrings(locale: Locale): Strings {
  return languages[locale];
}

/** Build a path for a locale, e.g. `localizedPath('es', '/')` → `/es/`. */
export function localizedPath(locale: Locale, path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (locale === defaultLocale) return clean;
  return clean === "/" ? `/${locale}/` : `/${locale}${clean}`;
}

export type { Strings };
