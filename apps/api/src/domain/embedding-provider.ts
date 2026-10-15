/** Turns text into embedding vectors. Swappable so tests can use a fake. */
export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[], signal?: AbortSignal): Promise<number[][]>;
}
