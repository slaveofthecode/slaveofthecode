import { z } from "zod";

/**
 * Locales the chat endpoint accepts. Mirrors `LOCALES` in `@portfolio/content`
 * (parity guarded by `test/chat-locales.test.ts`). Kept local on purpose: the
 * serverless function must not import the workspace TypeScript package at
 * runtime, because Vercel leaves bare specifiers external and Node cannot run
 * the package's `.ts` source.
 */
export const CHAT_LOCALES = ["en", "es"] as const;

/** The locale a chat request is answered in (mirrors the site language). */
export const chatLocaleSchema = z.enum(CHAT_LOCALES);

export type ChatLocale = z.infer<typeof chatLocaleSchema>;

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/**
 * The request body for `POST /chat`. The client is stateless: it sends the recent
 * conversation (capped) plus the locale. No server-side session is kept.
 */
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
  locale: chatLocaleSchema.default("en"),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatReply {
  reply: string;
}
