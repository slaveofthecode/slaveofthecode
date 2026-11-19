import { z } from "zod";
import { linkSchema } from "./common";

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  location: z.string().min(1),
  summary: z.string().min(1),
  links: z.array(linkSchema),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  /** Public URL to the portrait used as avatar/favicon, when one exists. */
  avatar: z.string().url().optional(),
});

export type Profile = z.infer<typeof profileSchema>;
