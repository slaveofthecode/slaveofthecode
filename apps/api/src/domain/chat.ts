import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

/**
 * The request body for `POST /chat`. The client is stateless: it sends the recent
 * conversation (capped). The site is English-only, so there is no locale field.
 */
export const chatRequestSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(12),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatReply {
  reply: string;
}
