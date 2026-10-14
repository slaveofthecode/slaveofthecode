import { z } from "zod";

/** A `YYYY-MM` month. */
export const yearMonthSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    "Expected a year-month date in YYYY-MM format",
  );

/** An ISO 8601 date (`YYYY-MM-DD`) or full timestamp. */
export const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/,
    "Expected an ISO 8601 date (YYYY-MM-DD or a full timestamp)",
  );

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export type Link = z.infer<typeof linkSchema>;
