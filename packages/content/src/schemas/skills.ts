import { z } from "zod";

export const skillGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  items: z.array(z.string().min(1)),
});

export type SkillGroup = z.infer<typeof skillGroupSchema>;
