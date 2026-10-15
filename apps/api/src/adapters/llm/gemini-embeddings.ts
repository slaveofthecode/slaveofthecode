import type { GeminiConfig } from "../../config";
import type { EmbeddingProvider } from "../../domain/embedding-provider";
import { GeminiError } from "./gemini-provider";

const BATCH_SIZE = 100;

interface BatchEmbedResponse {
  embeddings?: { values: number[] }[];
}

/** Google Gemini embeddings via REST `fetch` (no SDK). Node/Web compatible. */
export class GeminiEmbeddings implements EmbeddingProvider {
  readonly name = "gemini";

  constructor(private readonly config: GeminiConfig) {}

  async embed(texts: string[], signal?: AbortSignal): Promise<number[][]> {
    if (!this.config.apiKey) {
      throw new GeminiError("Missing GEMINI_API_KEY", 500);
    }

    const vectors: number[][] = [];
    const model = `models/${this.config.embedModel}`;

    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batch = texts.slice(i, i + BATCH_SIZE);
      const response = await fetch(
        `${this.config.baseUrl}/${model}:batchEmbedContents`,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-goog-api-key": this.config.apiKey,
          },
          signal,
          body: JSON.stringify({
            requests: batch.map((text) => ({
              model,
              content: { parts: [{ text }] },
            })),
          }),
        },
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new GeminiError(
          `Gemini embeddings failed (${response.status}): ${detail.slice(0, 200)}`,
          response.status,
        );
      }

      const data = (await response.json()) as BatchEmbedResponse;
      for (const embedding of data.embeddings ?? [])
        vectors.push(embedding.values);
    }

    return vectors;
  }
}
