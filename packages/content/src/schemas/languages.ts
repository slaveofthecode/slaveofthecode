import { z } from "zod";

export const languageSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  level: z.string().min(1),
});

export type Language = z.infer<typeof languageSchema>;
