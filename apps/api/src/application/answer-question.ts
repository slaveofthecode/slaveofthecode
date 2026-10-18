import type { ChatLocale, ChatMessage } from "../domain/chat.js";
import type { EmbeddingProvider } from "../domain/embedding-provider.js";
import type { LlmMessage, LlmProvider } from "../domain/llm-provider.js";
import type { RagStore } from "../domain/rag.js";
import { buildSystemPrompt } from "../domain/system-prompt.js";

export interface AnswerQuestionDeps {
  store: RagStore;
  embeddings: EmbeddingProvider;
  provider: LlmProvider;
  retrieveK?: number;
  maxOutputTokens?: number;
}

export interface AnswerQuestionInput {
  messages: ChatMessage[];
  locale: ChatLocale;
  signal?: AbortSignal;
}

/**
 * Use case: embed the latest question, retrieve the most relevant CV chunks from
 * the SQLite store (RAG, ADR-0006) and have the model answer grounded on them.
 */
export async function answerQuestion(
  input: AnswerQuestionInput,
  deps: AnswerQuestionDeps,
): Promise<string> {
  const lastUser = [...input.messages]
    .reverse()
    .find((message) => message.role === "user");
  const question = lastUser?.content ?? "";

  const [queryVector] = await deps.embeddings.embed([question], input.signal);
  const hits = deps.store.retrieve(
    queryVector ?? [],
    input.locale,
    deps.retrieveK ?? 6,
  );

  // Grounding guarantee: identity/contact questions ("what is your email?",
  // "how can I contact you?") rank poorly against long CV chunks, so the
  // profile chunk is always part of the context regardless of the vector
  // ranking. It is the smallest chunk and carries name, location, email,
  // phone and links.
  const profile = deps.store.getChunk(`${input.locale}:profile`);
  const context =
    profile && !hits.some((hit) => hit.id === profile.id)
      ? [profile, ...hits]
      : hits;

  const system = buildSystemPrompt(context, input.locale);

  const messages: LlmMessage[] = input.messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));

  return deps.provider.generate(messages, {
    system,
    maxOutputTokens: deps.maxOutputTokens,
    signal: input.signal,
  });
}
