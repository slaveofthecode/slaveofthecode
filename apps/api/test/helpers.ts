import type { ChatLocale } from "../src/domain/chat";
import type { EmbeddingProvider } from "../src/domain/embedding-provider";
import type { RagHit, RagStore } from "../src/domain/rag";

/** Deterministic tiny embedder for tests (dimension 3). */
export class FakeEmbeddings implements EmbeddingProvider {
  readonly name = "fake";
  calls = 0;

  async embed(texts: string[]): Promise<number[][]> {
    this.calls += 1;
    return texts.map((text) => [
      text.length % 7,
      (text.charCodeAt(0) ?? 0) % 11,
      1,
    ]);
  }
}

/** In-memory store returning a fixed set of pre-scored hits per locale. */
export class FakeStore implements RagStore {
  constructor(private readonly hits: RagHit[] = []) {}

  retrieve(_query: number[], locale: ChatLocale, limit: number): RagHit[] {
    return this.hits.filter((hit) => hit.locale === locale).slice(0, limit);
  }

  getChunk(id: string): RagHit | null {
    return this.hits.find((hit) => hit.id === id) ?? null;
  }
}

export function profileHit(locale: ChatLocale = "en"): RagHit {
  return {
    id: `${locale}:profile`,
    locale,
    section: "profile",
    title: "Gustavo Lopez",
    content: "Gustavo Lopez — Senior Full-Stack Developer",
    score: 0.99,
  };
}
