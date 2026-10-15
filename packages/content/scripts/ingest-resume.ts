import { access, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { type Content, contentSchema } from "../src";

/**
 * Structure `content-source/resume.txt` (extracted from the PDF) into the
 * committed JSON under `data/en` and `data/es`.
 *
 * Deterministic, format-tolerant parser: sections are located by keyword
 * (summary/profile/about, experience/employment/additional experience, skills/
 * technical stack, education, certifications, languages) in any order, so a
 * different PDF layout still maps onto the schema as long as those sections
 * exist. It uses no AI and does not translate — both locales receive the same
 * values, in the language the PDF was written in. `now.json` is never touched
 * (the "Now" section is hand-curated).
 *
 * `data/en` is rebuilt from the PDF. `data/es` keeps the hand-made Spanish
 * translations: entries are matched with `data/en` by a stable natural key, the
 * ids are reused, and the translatable text fields are carried over from the
 * existing `data/es` (only fields that also exist in the rebuilt `data/en`, so
 * the two locales stay in parity). New entries fall back to the PDF text.
 *
 * The source text may contain personal data (phone/email); this script never
 * prints field values — only counts — so it is safe to run in logs.
 *
 * Usage: `bun run ingest:parse` (or `bun run ingest` to extract + parse).
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const txtPath = resolve(root, "content-source/resume.txt");
const portraitPath = resolve(root, "apps/web/public/portrait.png");
const dataDir = resolve(here, "../data");

const MONTH_ALT =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";
const DATE_PART = `(?:${MONTH_ALT}\\.?\\s*['’]?\\d{2,4}|\\d{1,2}[/.]\\d{4}|\\b\\d{4}\\b)`;
const PRESENT_ALT = "(?:present|current|now|actualidad|today|ongoing)";
const RANGE_RE = new RegExp(
  `(${DATE_PART})\\s*(?:[-–—]|to|until|hasta)\\s*(${DATE_PART}|${PRESENT_ALT})`,
  "i",
);
const PRESENT_RE = new RegExp(`^${PRESENT_ALT}$`, "i");
const MONTH_NAME_RE = new RegExp(`^${MONTH_ALT}\\.?\\s*['’]?(\\d{2,4})$`, "i");

const EMAIL_RE = /[^\s@|·•]+@[^\s@|·•]+\.\w+/;
const PHONE_RE = /^\+?\d[\d\s().-]{6,}$/;
const URL_RE = /https?:\/\/[^\s|·•]+|www\.[^\s|·•]+/i;
const URL_TOKEN_RE = /^[a-z0-9%\-._~:/?#[\]@!$&'()*+,;=]+$/i;
const BULLET_RE = /^[•*·▪‣◦-]\s+/;
const TECH_SEP_RE = /\s+[-–—]\s+/;

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  may: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sep: "09",
  oct: "10",
  nov: "11",
  dec: "12",
};

type SectionKey =
  | "summary"
  | "experience"
  | "skills"
  | "education"
  | "certifications"
  | "languages";

const SECTION_PATTERNS: { key: SectionKey; re: RegExp }[] = [
  {
    key: "summary",
    re: /^(professional\s+|career\s+|executive\s+)?(summary|profile|about(\s+me)?|objective|description)$/i,
  },
  {
    key: "experience",
    re: /^(professional\s+|work\s+|employment\s+|relevant\s+|career\s+)?experience$/i,
  },
  {
    key: "experience",
    re: /^(employment(\s+history)?|work\s+history|career(\s+history)?)$/i,
  },
  {
    key: "experience",
    re: /^(additional|other|earlier|prior|previous|more)\s+experience$/i,
  },
  {
    key: "skills",
    re: /^(technical|core|key|professional|main)\s+(skills?|competencies|competences|expertise|technologies|stack(\s*&\s*.+)?)$/i,
  },
  {
    key: "skills",
    re: /^(skills?|competencies|competences|expertise|technologies|tech\s*stack)$/i,
  },
  {
    key: "skills",
    re: /^(technical|tech)\s+(stack|skills?|tooling)\b.*$/i,
  },
  {
    key: "education",
    re: /^(education|academic\s+(background|history|credentials))(\s*&\s*(certifications?|training))?$/i,
  },
  {
    key: "certifications",
    re: /^(certifications?|certificates?|licenses?)$/i,
  },
  {
    key: "languages",
    re: /^languages?$/i,
  },
];

const ROLE_NOUN_RE =
  /\b(engineer|engineering|developer|programmer|analyst|architect|manager|consultant|designer|specialist|administrator|scientist|officer|director|coordinator|technician|accountant|assistant|researcher|tester|intern|founder|cto|ceo|cio|cfo|devops|sre|analista|programador|ingeniero|desarrollador|consultor|gerente|responsable)\b/i;
const ROLE_PREFIX_RE =
  /^(senior|sr\.?|junior|jr\.?|lead|principal|staff|head|chief|full[-\s]?stack|front[-\s]?end|back[-\s]?end|fullstack|frontend|backend|software|web|mobile|cloud|data|machine|product|project|technical|tech|it|qa|ai|ml|systems?|network|security|ux|ui|react|angular|vue|node(?:\.?js)?|python|java(?:script)?|typescript|ruby|php|swift|kotlin|flutter|native|dotnet|\.net|aws|azure|gcp|docker|kubernetes|sql|android|ios|freelance|part[-\s]?time|contract)$/i;

const SKILL_CATEGORY_LABELS = [
  "AI-Assisted Development",
  "AI Development Tools",
  "DevOps & Infrastructure",
  "Testing Frameworks",
  "Front-End",
  "Back-End",
  "Full-Stack",
  "Databases",
  "Database",
  "Testing",
  "Frameworks",
  "Libraries",
  "Platforms",
  "Languages",
  "Mobile",
  "Cloud",
  "Security",
  "Networking",
  "Tools",
  "AI",
  "Other",
];

interface Section {
  key: SectionKey;
  index: number;
  header: string;
  body: string[];
}

interface Header {
  name: string;
  headline: string;
  location: string;
  summary: string;
  phone?: string;
  email?: string;
  links: { label: string; url: string }[];
}

interface DateRange {
  pre: string;
  start: string;
  end: string | null;
}

interface EducationDraft {
  institution: string;
  title: string;
  startDate: string;
  endDate: string | null;
}

interface CertificationDraft {
  name: string;
  url?: string;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function slug(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function uniqueId(base: string, used: Set<string>): string {
  const stem = base || "item";
  let id = stem;
  let n = 2;
  while (used.has(id)) {
    id = `${stem}-${n}`;
    n += 1;
  }
  used.add(id);
  return id;
}

function normalizeYear(raw: string): string {
  const value = Number.parseInt(raw, 10);
  const full = raw.length <= 2 ? 2000 + value : value;
  return String(full).padStart(4, "0");
}

function parseDateToken(token: string): { year: string; month: string | null } {
  const value = token.trim().toLowerCase();

  const named = MONTH_NAME_RE.exec(value);
  if (named) {
    const monthName = value.slice(0, 3);
    return {
      year: normalizeYear(named[1] ?? ""),
      month: MONTHS[monthName] ?? null,
    };
  }

  const numeric = /^(\d{1,2})[/.](\d{4})$/.exec(value);
  if (numeric) {
    return {
      year: numeric[2] ?? "",
      month: (numeric[1] ?? "").padStart(2, "0"),
    };
  }

  const yearOnly = /^(\d{4})$/.exec(value);
  if (yearOnly) return { year: yearOnly[1] ?? "", month: null };

  return { year: "", month: null };
}

function isPresent(token: string): boolean {
  return new RegExp(`^${PRESENT_ALT}$`, "i").test(token.trim());
}

function toYearMonth(token: string, isEnd: boolean): string | null {
  if (isPresent(token)) return null;
  const { year, month } = parseDateToken(token);
  if (!year) return null;
  return `${year}-${month ?? (isEnd ? "12" : "01")}`;
}

function toYearOrYearMonth(token: string): string | null {
  const { year, month } = parseDateToken(token);
  if (!year) return null;
  return month ? `${year}-${month}` : year;
}

function findRange(line: string): DateRange | null {
  const match = RANGE_RE.exec(line);
  if (!match) return null;
  return {
    pre: line.slice(0, match.index).trim(),
    start: match[1] ?? "",
    end: match[2] ?? "",
  };
}

function sectionKey(line: string): SectionKey | null {
  const clean = line.replace(/[:\s]+$/, "").trim();
  for (const { key, re } of SECTION_PATTERNS) {
    if (re.test(clean)) return key;
  }
  return null;
}

function findSections(lines: string[]): Section[] {
  const found: { key: SectionKey; index: number; header: string }[] = [];
  lines.forEach((line, index) => {
    const key = sectionKey(line);
    if (key) found.push({ key, index, header: line });
  });
  return found.map((section, i) => ({
    key: section.key,
    index: section.index,
    header: section.header,
    body: lines.slice(section.index + 1, found[i + 1]?.index ?? lines.length),
  }));
}

function toLink(part: string): { label: string; url: string } {
  const url = new URL(/^https?:\/\//i.test(part) ? part : `https://${part}`);
  const host = url.hostname.replace(/^www\./, "");
  let label = host.charAt(0).toUpperCase() + host.slice(1);
  if (/linkedin\.com$/i.test(host)) label = "LinkedIn";
  else if (/github\.com$/i.test(host)) label = "GitHub";
  return { label, url: url.toString() };
}

function combine(...parts: string[]): string {
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

function parseHeader(lines: string[], summary: string): Header {
  const name = (lines[0] ?? "").trim();
  const headline = (lines[1] ?? "").trim();

  const contactIndex = lines.findIndex(
    (line, index) =>
      index >= 2 &&
      (EMAIL_RE.test(line) || URL_RE.test(line) || PHONE_RE.test(line)),
  );

  let location = "";
  let phone: string | undefined;
  let email: string | undefined;
  const links: { label: string; url: string }[] = [];

  const contactLine = contactIndex >= 0 ? (lines[contactIndex] ?? "") : "";
  for (const raw of contactLine.split(/[|·•]/)) {
    const part = raw.trim();
    if (!part) continue;
    const foundEmail = EMAIL_RE.exec(part);
    if (!email && foundEmail) {
      email = foundEmail[0];
      continue;
    }
    if (!phone && PHONE_RE.test(part)) {
      phone = part;
      continue;
    }
    const foundUrl = URL_RE.exec(part);
    if (foundUrl) {
      links.push(toLink(foundUrl[0]));
      continue;
    }
    if (!location) location = part;
  }

  for (const line of lines.slice(contactIndex + 1)) {
    const foundUrl = URL_RE.exec(line);
    if (foundUrl) links.push(toLink(foundUrl[0]));
  }

  const fallbackSummary = lines
    .slice(contactIndex + 1)
    .filter((line) => !URL_RE.test(line) && !sectionKey(line))
    .join(" ");

  return {
    name,
    headline,
    location,
    summary: combine(summary) || combine(fallbackSummary),
    phone,
    email,
    links,
  };
}

function splitCompanyRole(line: string): { company: string; role: string } {
  const tokens = line.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i] ?? "";
    if (ROLE_PREFIX_RE.test(token) || ROLE_NOUN_RE.test(token)) {
      const company = tokens.slice(0, i).join(" ").trim();
      const role = tokens.slice(i).join(" ").trim();
      if (company && role) return { company, role };
    }
  }
  if (tokens.length >= 2) {
    return { company: tokens[0] ?? line, role: tokens.slice(1).join(" ") };
  }
  return { company: line, role: line };
}

function parseTech(lines: string[]): string[] {
  const joined = combine(...lines);
  if (!joined || !TECH_SEP_RE.test(joined)) return [];
  return lines
    .join(" ")
    .split(TECH_SEP_RE)
    .map((item) => item.replace(/^[-–—]\s*/, "").trim())
    .filter(Boolean);
}

function parseExperience(
  body: string[],
  used: Set<string>,
): Content["experience"] {
  const dateIndexes: number[] = [];
  body.forEach((line, index) => {
    if (findRange(line)) dateIndexes.push(index);
  });

  const jobs: Content["experience"] = [];
  for (let k = 0; k < dateIndexes.length; k += 1) {
    const at = dateIndexes[k] ?? 0;
    const range = findRange(body[at] ?? "");
    if (!range) continue;

    const companyLine = (body[at - 1] ?? "").trim();
    let company: string;
    let role: string;
    if (range.pre) {
      company = companyLine;
      role = range.pre;
    } else {
      ({ company, role } = splitCompanyRole(companyLine));
    }
    company = combine(company);
    role = combine(role);
    if (!company) continue;

    const nextCompany =
      k + 1 < dateIndexes.length
        ? (dateIndexes[k + 1] ?? body.length) - 1
        : body.length;
    const entryLines = body.slice(at + 1, nextCompany);

    const startDate = toYearMonth(range.start, false);
    const endDate = range.end ? toYearMonth(range.end, true) : null;
    if (!startDate) continue;

    const highlights: string[] = [];
    const techLines: string[] = [];
    let summary = "";
    for (const raw of entryLines) {
      const line = raw.trim();
      if (!line) continue;
      if (BULLET_RE.test(line)) {
        highlights.push(line.replace(BULLET_RE, "").trim());
        continue;
      }
      if (TECH_SEP_RE.test(line)) {
        techLines.push(line);
        continue;
      }
      if (highlights.length > 0) {
        const last = highlights.length - 1;
        highlights[last] = combine(highlights[last] ?? "", line);
      } else {
        summary = combine(summary, line);
      }
    }

    jobs.push({
      id: uniqueId(slug(company), used),
      company,
      role: role || company,
      startDate,
      endDate,
      ...(summary ? { summary } : {}),
      highlights,
      tech: parseTech(techLines),
    });
  }
  return jobs;
}

function blockify(body: string[]): string[] {
  const blocks: string[] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const prev = blocks[blocks.length - 1];
    const continuesUrl =
      prev !== undefined &&
      /https?:\/\/[^\s]*$/.test(prev) &&
      /^[a-z0-9%\-._~:/?#[\]@!$&'()*+,;=]+$/i.test(line);
    const merges =
      prev !== undefined &&
      (/\|$/.test(prev) || !/\s/.test(line) || continuesUrl);
    if (merges && prev !== undefined) {
      blocks[blocks.length - 1] =
        `${prev}${line.startsWith("http") ? " " : ""}${line}`;
    } else {
      blocks.push(line);
    }
  }
  return blocks;
}

function parseEducationLine(block: string): EducationDraft | null {
  const range = findRange(block);
  if (!range) return null;
  const startDate = toYearOrYearMonth(range.start);
  if (!startDate) return null;
  const endDate = range.end ? toYearOrYearMonth(range.end) : null;

  const parts = block
    .split("|")
    .map((part) => part.trim())
    .filter(Boolean);
  const datePart =
    parts.find((part) => part.includes(range.start)) ??
    (parts.length > 1 ? parts[1] : parts[0]) ??
    block;
  const other = parts.find((part) => part !== datePart) ?? "";

  const rangeRe = range.end
    ? new RegExp(
        `\\(?\\s*${escapeRegExp(range.start)}\\s*[-–—]\\s*${escapeRegExp(range.end)}\\s*\\)?`,
        "i",
      )
    : new RegExp(`\\(?\\s*${escapeRegExp(range.start)}\\s*\\)?`, "i");
  const institution = combine(datePart.replace(rangeRe, ""));

  if (!institution) return null;
  return {
    institution,
    title: combine(other) || institution,
    startDate,
    endDate,
  };
}

function parseCert(block: string): CertificationDraft | null {
  const urlMatch = URL_RE.exec(block);
  let url: string | undefined;
  if (urlMatch) {
    try {
      const raw = urlMatch[0];
      url = new URL(
        /^https?:\/\//i.test(raw) ? raw : `https://${raw}`,
      ).toString();
    } catch {
      url = undefined;
    }
  }
  const name = combine(
    block.replace(new RegExp(URL_RE.source, "gi"), " ").replace(/\|/g, " "),
  );
  if (!name) return null;
  return { name, ...(url ? { url } : {}) };
}

function parseEducationAndCerts(body: string[]): {
  education: EducationDraft[];
  certifications: CertificationDraft[];
} {
  const education: EducationDraft[] = [];
  const certifications: CertificationDraft[] = [];
  for (const block of blockify(body)) {
    if (findRange(block)) {
      const entry = parseEducationLine(block);
      if (entry) education.push(entry);
    } else {
      const cert = parseCert(block);
      if (cert) certifications.push(cert);
    }
  }
  return { education, certifications };
}

function parseSkillGroups(body: string[]): Content["skills"] {
  const text = combine(
    ...body.filter((line) => line.trim() && !/^category\b/i.test(line)),
  );
  if (!text) return [];

  const labels = SKILL_CATEGORY_LABELS.map(escapeRegExp);
  const re = new RegExp(`\\b(${labels.join("|")})\\b`, "gi");
  const matches = [...text.matchAll(re)];

  const picked: RegExpMatchArray[] = [];
  for (const match of matches) {
    const last = picked[picked.length - 1];
    if (last && (match.index ?? 0) < (last.index ?? 0) + last[0].length)
      continue;
    picked.push(match);
  }

  const used = new Set<string>();
  const groups: Content["skills"] = [];
  for (let i = 0; i < picked.length; i += 1) {
    const match = picked[i];
    if (!match) continue;
    const start = (match.index ?? 0) + match[0].length;
    const end = picked[i + 1]?.index ?? text.length;
    const items = text
      .slice(start, end)
      .split(/[,;·|]/)
      .map((item) => item.trim())
      .filter(Boolean);
    if (items.length === 0) continue;
    const name = match[0].trim();
    groups.push({ id: uniqueId(slug(name), used), name, items });
  }

  if (groups.length >= 2) return groups;

  const items = text
    .split(/[,;·|]/)
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length
    ? [{ id: "technical-skills", name: "Technical Skills", items }]
    : [];
}

function parseLanguages(body: string[]): Content["languages"] {
  const used = new Set<string>();
  const languages: Content["languages"] = [];
  for (const raw of body) {
    const line = raw.trim();
    if (!line) continue;
    const match = /^(.+?)\s*[:|–—]\s*(.+)$/.exec(line);
    const name = combine(match?.[1] ?? line);
    const level = combine(match?.[2] ?? "") || "—";
    if (!name) continue;
    languages.push({ id: uniqueId(slug(name), used), name, level });
  }
  return languages;
}

type Entry = Record<string, unknown> & { id: string };

const TEXT_FIELDS = {
  experience: ["company", "role", "location", "summary", "highlights"],
  skills: ["name", "items"],
  languages: ["name", "level"],
  education: ["institution", "title"],
  certifications: ["name", "issuer"],
} satisfies Record<string, string[]>;

const EXPERIENCE_KEY = (entry: Entry): string =>
  `${String(entry.company)}|${String(entry.startDate)}`;
const EDUCATION_KEY = (entry: Entry): string =>
  `${String(entry.institution)}|${String(entry.startDate)}`;
const ID_KEY = (entry: Entry): string => entry.id;
const CERTIFICATION_KEY = (entry: Entry): string => String(entry.name);

async function readArray(path: string): Promise<Entry[]> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    return Array.isArray(parsed) ? (parsed as Entry[]) : [];
  } catch {
    return [];
  }
}

async function readObject(
  path: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

function reuseIds<T extends { id: string }>(
  entries: T[],
  oldEntries: Entry[],
  keyOf: (entry: Entry) => string,
): void {
  const byKey = new Map<string, string>();
  for (const old of oldEntries) byKey.set(keyOf(old), old.id);
  for (const entry of entries) {
    const id = byKey.get(keyOf(entry as unknown as Entry));
    if (id) entry.id = id;
  }
}

function normalizeTokens(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isEquivalent(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return (
      a.length === b.length &&
      a.every((item, index) => isEquivalent(item, b[index]))
    );
  }
  if (typeof a === "string" && typeof b === "string") {
    if (a === b) return true;
    const normalized = normalizeTokens(a);
    if (!normalized) return false;
    return normalizeTokens(b) === normalized;
  }
  return a === b;
}

function compatible(a: unknown, b: unknown): boolean {
  if (typeof a === "string" && typeof b === "string") return true;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length;
  return false;
}

function mergeEntry<T extends { id: string }>(next: T, old: Entry): T {
  const out: Entry = { ...(next as unknown as Entry) };
  for (const [key, oldValue] of Object.entries(old)) {
    if (!(key in out)) {
      out[key] = oldValue;
      continue;
    }
    if (isEquivalent(oldValue, out[key])) out[key] = oldValue;
  }
  return out as unknown as T;
}

function mergeCollection<T extends { id: string }>(
  next: T[],
  old: Entry[],
): T[] {
  const byId = new Map(old.map((entry) => [entry.id, entry]));
  return next.map((entry) => {
    const oldEntry = byId.get(entry.id);
    return oldEntry ? mergeEntry(entry, oldEntry) : entry;
  });
}

function preserveCollection<T extends { id: string }>(
  next: T[],
  old: Entry[],
): T[] {
  const byId = new Map(old.map((entry) => [entry.id, entry]));
  return next.map(
    (entry) => (byId.get(entry.id) as unknown as T | undefined) ?? entry,
  );
}

function translateCollection<T extends { id: string }>(
  next: T[],
  oldEs: Entry[],
  textFields: string[],
): T[] {
  const byId = new Map(oldEs.map((entry) => [entry.id, entry]));
  return next.map((entry) => {
    const oldEntry = byId.get(entry.id);
    if (!oldEntry) return entry;
    const out: Entry = { ...(entry as unknown as Entry) };
    for (const field of textFields) {
      if (field in out && compatible(oldEntry[field], out[field])) {
        out[field] = oldEntry[field];
      }
    }
    return out as unknown as T;
  });
}

function mergeProfile(
  profile: Content["profile"],
  old: Record<string, unknown> | undefined,
): Content["profile"] {
  if (!old || old.name !== profile.name) return profile;
  const out: Record<string, unknown> = { ...profile };
  for (const field of ["headline", "location", "summary"]) {
    if (isEquivalent(old[field], out[field])) out[field] = old[field];
  }
  if (
    Array.isArray(old.links) &&
    Array.isArray(out.links) &&
    out.links.length === 0 &&
    old.links.length > 0
  ) {
    out.links = old.links;
  }
  return out as unknown as Content["profile"];
}

function translateProfile(
  profile: Content["profile"],
  oldEs: Record<string, unknown> | undefined,
): Content["profile"] {
  if (!oldEs) return profile;
  const out: Record<string, unknown> = { ...profile };
  for (const field of ["headline", "location", "summary"]) {
    if (typeof oldEs[field] === "string" && typeof out[field] === "string") {
      out[field] = oldEs[field];
    }
  }
  if (Array.isArray(oldEs.links) && Array.isArray(out.links)) {
    const byUrl = new Map(
      (oldEs.links as Array<Record<string, unknown>>).map((link) => [
        link.url,
        link,
      ]),
    );
    out.links = (out.links as Array<Record<string, unknown>>).map((link) => {
      const match = byUrl.get(link.url);
      return match && typeof match.label === "string"
        ? { ...link, label: match.label }
        : link;
    });
  }
  return out as unknown as Content["profile"];
}

interface LocaleData {
  profile?: Record<string, unknown>;
  experience: Entry[];
  skills: Entry[];
  languages: Entry[];
  education: Entry[];
  certifications: Entry[];
}

async function loadLocale(locale: string): Promise<LocaleData> {
  return {
    profile: await readObject(resolve(dataDir, locale, "profile.json")),
    experience: await readArray(resolve(dataDir, locale, "experience.json")),
    skills: await readArray(resolve(dataDir, locale, "skills.json")),
    languages: await readArray(resolve(dataDir, locale, "languages.json")),
    education: await readArray(resolve(dataDir, locale, "education.json")),
    certifications: await readArray(
      resolve(dataDir, locale, "certifications.json"),
    ),
  };
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortValue(item)]),
    );
  }
  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

async function writeLocale(locale: string, content: Content): Promise<void> {
  const files: Record<string, unknown> = {
    "profile.json": content.profile,
    "experience.json": content.experience,
    "skills.json": content.skills,
    "languages.json": content.languages,
    "education.json": content.education,
    "certifications.json": content.certifications,
  };
  for (const [name, value] of Object.entries(files)) {
    const path = resolve(dataDir, locale, name);
    let existing: unknown;
    try {
      existing = JSON.parse(await readFile(path, "utf8"));
    } catch {
      existing = undefined;
    }
    if (
      existing !== undefined &&
      stableStringify(existing) === stableStringify(value)
    ) {
      continue;
    }
    await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  }
}

async function main(): Promise<void> {
  const raw = await readFile(txtPath, "utf8");
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const sections = findSections(lines);
  const headerLines = lines.slice(0, sections[0]?.index ?? lines.length);
  const summarySection = sections.find((section) => section.key === "summary");
  const header = parseHeader(
    headerLines,
    summarySection ? combine(...summarySection.body) : "",
  );

  const usedExp = new Set<string>();
  const experience = sections
    .filter((section) => section.key === "experience")
    .flatMap((section) => parseExperience(section.body, usedExp));

  const skills = sections
    .filter((section) => section.key === "skills")
    .flatMap((section) => parseSkillGroups(section.body));

  const usedEdu = new Set<string>();
  const usedCert = new Set<string>();
  const education: Content["education"] = [];
  const certifications: Content["certifications"] = [];
  for (const section of sections) {
    if (section.key === "education") {
      const parsed = /certification/i.test(section.header)
        ? parseEducationAndCerts(section.body)
        : {
            education: blockify(section.body)
              .map(parseEducationLine)
              .filter((entry): entry is EducationDraft => entry !== null),
            certifications: [] as CertificationDraft[],
          };
      for (const entry of parsed.education) {
        education.push({
          id: uniqueId(slug(entry.institution), usedEdu),
          institution: entry.institution,
          title: entry.title,
          startDate: entry.startDate,
          endDate: entry.endDate,
        });
      }
      for (const cert of parsed.certifications) {
        certifications.push({
          id: uniqueId(slug(cert.name), usedCert),
          name: cert.name,
          ...(cert.url ? { url: cert.url } : {}),
        });
      }
    } else if (section.key === "certifications") {
      for (const cert of blockify(section.body)) {
        const parsed = parseCert(cert);
        if (!parsed) continue;
        certifications.push({
          id: uniqueId(slug(parsed.name), usedCert),
          name: parsed.name,
          ...(parsed.url ? { url: parsed.url } : {}),
        });
      }
    }
  }

  const languages = sections
    .filter((section) => section.key === "languages")
    .flatMap((section) => parseLanguages(section.body));

  let avatar: string | undefined;
  try {
    await access(portraitPath);
    avatar = "/portrait.png";
  } catch {
    avatar = undefined;
  }

  const now = JSON.parse(
    await readFile(resolve(dataDir, "en/now.json"), "utf8"),
  ) as Content["now"];

  const oldEn = await loadLocale("en");
  const oldEs = await loadLocale("es");

  reuseIds(experience as unknown as Entry[], oldEn.experience, EXPERIENCE_KEY);
  reuseIds(skills as unknown as Entry[], oldEn.skills, ID_KEY);
  reuseIds(languages as unknown as Entry[], oldEn.languages, ID_KEY);
  reuseIds(education as unknown as Entry[], oldEn.education, EDUCATION_KEY);
  reuseIds(
    certifications as unknown as Entry[],
    oldEn.certifications,
    CERTIFICATION_KEY,
  );

  const rawProfile: Content["profile"] = {
    name: header.name,
    headline: header.headline,
    location: header.location,
    summary: header.summary,
    links: header.links,
    ...(header.email ? { email: header.email } : {}),
    ...(header.phone ? { phone: header.phone } : {}),
    ...(avatar ? { avatar } : {}),
  };

  const enContent: Content = {
    profile: mergeProfile(rawProfile, oldEn.profile),
    experience: mergeCollection(experience, oldEn.experience),
    skills: mergeCollection(skills, oldEn.skills),
    languages: mergeCollection(languages, oldEn.languages),
    education: mergeCollection(education, oldEn.education),
    certifications: preserveCollection(certifications, oldEn.certifications),
    now,
  };
  contentSchema.parse(enContent);

  const esContent: Content = {
    profile: translateProfile(enContent.profile, oldEs.profile),
    experience: translateCollection(
      enContent.experience,
      oldEs.experience,
      TEXT_FIELDS.experience,
    ),
    skills: translateCollection(
      enContent.skills,
      oldEs.skills,
      TEXT_FIELDS.skills,
    ),
    languages: translateCollection(
      enContent.languages,
      oldEs.languages,
      TEXT_FIELDS.languages,
    ),
    education: translateCollection(
      enContent.education,
      oldEs.education,
      TEXT_FIELDS.education,
    ),
    certifications: preserveCollection(certifications, oldEs.certifications),
    now,
  };
  contentSchema.parse(esContent);

  await writeLocale("en", enContent);
  await writeLocale("es", esContent);

  console.log(
    `Ingested ${experience.length} job(s), ${skills.length} skill group(s), ${education.length} education, ${certifications.length} certification(s), ${languages.length} language(s).`,
  );
  console.log(
    "Wrote 6 file(s) to data/en (from PDF) and data/es (translations preserved; now.json untouched).",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`ingest-resume failed: ${message}`);
  process.exitCode = 1;
});
