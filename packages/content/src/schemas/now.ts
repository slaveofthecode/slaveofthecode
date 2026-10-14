import { z } from "zod";
import { isoDateSchema, linkSchema } from "./common";

export const nowKindSchema = z.enum(["course", "project", "learning", "other"]);
export const nowStatusSchema = z.enum(["in-progress", "paused", "done"]);

export const nowItemSchema = z.object({
  id: z.string().min(1),
  kind: nowKindSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  progress: z.number().int().min(0).max(100),
  status: nowStatusSchema,
  startedAt: isoDateSchema.optional(),
  updatedAt: isoDateSchema,
  links: z.array(linkSchema),
  tags: z.array(z.string().min(1)),
});

export type NowItem = z.infer<typeof nowItemSchema>;
export type NowKind = z.infer<typeof nowKindSchema>;
export type NowStatus = z.infer<typeof nowStatusSchema>;
