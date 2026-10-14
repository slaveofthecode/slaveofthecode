import { z } from "zod";
import { yearMonthSchema } from "./common";

export const experienceSchema = z.object({
  id: z.string().min(1),
  company: z.string().min(1),
  role: z.string().min(1),
  startDate: yearMonthSchema,
  endDate: yearMonthSchema.nullable(),
  location: z.string().min(1).optional(),
  summary: z.string().min(1).optional(),
  highlights: z.array(z.string().min(1)),
  tech: z.array(z.string().min(1)),
});

export type Experience = z.infer<typeof experienceSchema>;
