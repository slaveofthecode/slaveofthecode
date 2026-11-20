import { z } from "zod";
import { assetUrlSchema, linkSchema } from "./common";

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  summary: z.string().min(1),
  yearsOfExperience: z.string().min(1),
  englishLevel: z.string().min(1),
  links: z.array(linkSchema),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  atsPhone: z.string().min(1).optional(),
  /** Public URL or root-relative path to the portrait used as avatar/favicon. */
  avatar: assetUrlSchema.optional(),
});

export type Profile = z.infer<typeof profileSchema>;
