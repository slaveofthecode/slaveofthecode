import { z } from "zod";
import { assetUrlSchema, isoDateOnlySchema } from "./common";

export const personalProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  lastCommit: isoDateOnlySchema,
  description: z.string().min(1),
  tech: z.array(z.string().min(1)),
  repoUrl: z.string().url(),
  productionUrl: z.string().url(),
  thumbnailUrl: assetUrlSchema,
});

export type PersonalProject = z.infer<typeof personalProjectSchema>;
