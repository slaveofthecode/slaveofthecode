import { z } from "zod";
import { certificationSchema } from "./certifications";
import { educationSchema } from "./education";
import { experienceSchema } from "./experience";
import { languageSchema } from "./languages";
import { nowItemSchema } from "./now";
import { personalProjectSchema } from "./personal-project";
import { profileSchema } from "./profile";
import { skillGroupSchema } from "./skills";

export const contentSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceSchema).default([]),
  skills: z.array(skillGroupSchema).default([]),
  languages: z.array(languageSchema).default([]),
  education: z.array(educationSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  now: z.array(nowItemSchema).default([]),
  personalProjects: z.array(personalProjectSchema).default([]),
});

export type Content = z.infer<typeof contentSchema>;

export * from "./certifications";
export * from "./common";
export * from "./education";
export * from "./experience";
export * from "./languages";
export * from "./now";
export * from "./personal-project";
export * from "./profile";
export * from "./skills";
