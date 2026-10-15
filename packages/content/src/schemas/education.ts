import { z } from "zod";
import { yearOrYearMonthSchema } from "./common";

export const educationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  title: z.string().min(1),
  startDate: yearOrYearMonthSchema,
  endDate: yearOrYearMonthSchema.nullable(),
});

export type Education = z.infer<typeof educationSchema>;
