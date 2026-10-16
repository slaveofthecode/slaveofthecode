import { LOCALES } from "@portfolio/content";
import { z } from "zod";

/** The locale a chat request is answered in (mirrors the site language). */
export const chatLocaleSchema = z.enum(LOCALES);

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
