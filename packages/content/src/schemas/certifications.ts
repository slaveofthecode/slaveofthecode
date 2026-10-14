import { z } from "zod";
import { yearOrYearMonthSchema } from "./common";

export const certificationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  issuer: z.string().min(1),
  date: yearOrYearMonthSchema.optional(),
  url: z.string().url().optional(),
});

export type Certification = z.infer<typeof certificationSchema>;
