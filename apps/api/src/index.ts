export { createHandler, handleRequest } from "./adapters/http/router.js";
export type { HandlerDeps } from "./adapters/http/router.js";
export { GeminiProvider, GeminiError } from "./adapters/llm/gemini-provider.js";
export { GeminiEmbeddings } from "./adapters/llm/gemini-embeddings.js";
export { FakeProvider } from "./adapters/llm/fake-provider.js";
export {
  buildRagBytes,
  SqliteRagStore,
  type RagRecord,
} from "./adapters/rag/sqlite-store.js";
export { InMemoryRateLimiter } from "./adapters/rate-limit/rate-limiter.js";
export { loadConfig } from "./config.js";
export { answerQuestion } from "./application/answer-question.js";
export { buildChunks, cosineSimilarity } from "./domain/rag.js";
export { buildSystemPrompt } from "./domain/system-prompt.js";
export { chatRequestSchema } from "./domain/chat.js";
export type { ChatMessage, ChatRequest, ChatLocale } from "./domain/chat.js";
export type { EmbeddingProvider } from "./domain/embedding-provider.js";
export type { LlmProvider, LlmMessage } from "./domain/llm-provider.js";
export type { RagChunk, RagHit, RagStore } from "./domain/rag.js";
