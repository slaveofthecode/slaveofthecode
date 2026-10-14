import { z } from "zod";
import { yearMonthSchema } from "./common";

export const educationSchema = z.object({
  id: z.string().min(1),
  institution: z.string().min(1),
  title: z.string().min(1),
  startDate: yearMonthSchema,
  endDate: yearMonthSchema.nullable(),
});

export type Education = z.infer<typeof educationSchema>;
