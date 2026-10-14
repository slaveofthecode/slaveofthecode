import { z } from "zod";
import { certificationSchema } from "./certifications";
import { educationSchema } from "./education";
import { experienceSchema } from "./experience";
import { languageSchema } from "./languages";
import { nowItemSchema } from "./now";
import { profileSchema } from "./profile";
import { skillGroupSchema } from "./skills";

export const contentSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema),
  skills: z.array(skillGroupSchema),
  languages: z.array(languageSchema),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  now: z.array(nowItemSchema),
});

export type Content = z.infer<typeof contentSchema>;

export * from "./certifications";
export * from "./common";
export * from "./education";
export * from "./experience";
export * from "./languages";
export * from "./now";
export * from "./profile";
export * from "./skills";
