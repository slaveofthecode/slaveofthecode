export { createHandler, handleRequest } from "./adapters/http/router";
export type { HandlerDeps } from "./adapters/http/router";
export { GeminiProvider, GeminiError } from "./adapters/llm/gemini-provider";
export { GeminiEmbeddings } from "./adapters/llm/gemini-embeddings";
export { FakeProvider } from "./adapters/llm/fake-provider";
export {
  buildRagBytes,
  SqliteRagStore,
  type RagRecord,
} from "./adapters/rag/sqlite-store";
export { InMemoryRateLimiter } from "./adapters/rate-limit/rate-limiter";
export { loadConfig } from "./config";
export { answerQuestion } from "./application/answer-question";
export { buildChunks, cosineSimilarity } from "./domain/rag";
export { buildSystemPrompt } from "./domain/system-prompt";
export { chatRequestSchema } from "./domain/chat";
export type { ChatMessage, ChatRequest, ChatLocale } from "./domain/chat";
export type { EmbeddingProvider } from "./domain/embedding-provider";
export type { LlmProvider, LlmMessage } from "./domain/llm-provider";
export type { RagChunk, RagHit, RagStore } from "./domain/rag";
