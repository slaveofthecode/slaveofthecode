import type { Content } from "@portfolio/content";
import type { ChatLocale } from "./chat.js";

/** A retrievable piece of the CV. */
export interface RagChunk {
  id: string;
  locale: ChatLocale;
  section: string;
  title: string;
  content: string;
}

export interface RagHit extends RagChunk {
  score: number;
}

/** Vector store abstraction (ADR-0007). */
export interface RagStore {
  retrieve(query: number[], locale: ChatLocale, limit: number): RagHit[];
}

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const length = Math.min(a.length, b.length);
  for (let i = 0; i < length; i += 1) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function joinLines(lines: (string | undefined | null)[]): string {
  return lines
    .filter((line): line is string => Boolean(line?.trim()))
    .join("\n");
}

/**
 * Splits the validated CV for a locale into retrievable chunks (one per logical
 * fact: profile, each role, each skill group, each now item, ...). Deterministic.
 */
export function buildChunks(content: Content, locale: ChatLocale): RagChunk[] {
  const chunks: RagChunk[] = [];
  const { profile } = content;

  chunks.push({
    id: `${locale}:profile`,
    locale,
    section: "profile",
    title: profile.name,
    content: joinLines([
      `${profile.name} — ${profile.headline}`,
      `Location: ${profile.location}`,
      profile.email ? `Email: ${profile.email}` : null,
      profile.phone ? `Phone: ${profile.phone}` : null,
      profile.summary,
    ]),
  });

  for (const job of content.experience) {
    chunks.push({
      id: `${locale}:experience:${job.id}`,
      locale,
      section: "experience",
      title: `${job.role} @ ${job.company}`,
      content: joinLines([
        `${job.role} at ${job.company}${job.location ? ` (${job.location})` : ""}`,
        `Dates: ${job.startDate} - ${job.endDate ?? "present"}`,
        job.summary,
        job.highlights.length > 0
          ? `Highlights:\n- ${job.highlights.join("\n- ")}`
          : null,
        job.tech.length > 0 ? `Tech: ${job.tech.join(", ")}` : null,
      ]),
    });
  }

  for (const group of content.skills) {
    chunks.push({
      id: `${locale}:skills:${group.id}`,
      locale,
      section: "skills",
      title: group.name,
      content: `Skills — ${group.name}: ${group.items.join(", ")}`,
    });
  }

  if (content.languages.length > 0) {
    chunks.push({
      id: `${locale}:languages`,
      locale,
      section: "languages",
      title: "Languages",
      content: `Languages: ${content.languages.map((l) => `${l.name} (${l.level})`).join(", ")}`,
    });
  }

  for (const edu of content.education) {
    chunks.push({
      id: `${locale}:education:${edu.id}`,
      locale,
      section: "education",
      title: edu.title,
      content: joinLines([
        `${edu.title} — ${edu.institution}`,
        `Dates: ${edu.startDate} - ${edu.endDate ?? "present"}`,
      ]),
    });
  }

  for (const cert of content.certifications) {
    chunks.push({
      id: `${locale}:certifications:${cert.id}`,
      locale,
      section: "certifications",
      title: cert.name,
      content: joinLines([
        `Certification: ${cert.name}`,
        cert.issuer ? `Issuer: ${cert.issuer}` : null,
        cert.date ? `Date: ${cert.date}` : null,
      ]),
    });
  }

  for (const item of content.now) {
    chunks.push({
      id: `${locale}:now:${item.id}`,
      locale,
      section: "now",
      title: item.title,
      content: joinLines([
        `What I'm working on now — ${item.title} (${item.kind}, ${item.progress}% ${item.status})`,
        item.description,
        item.tags.length > 0 ? `Tags: ${item.tags.join(", ")}` : null,
      ]),
    });
  }

  return chunks;
}
