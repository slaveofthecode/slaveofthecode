import { z } from "zod";

/** An absolute URL or a root-relative public asset path. */
export const assetUrlSchema = z
  .string()
  .min(1)
  .refine(
    (value) => value.startsWith("/") || /^https?:\/\//.test(value),
    "Expected an absolute URL or a root-relative path",
  );

/** A `YYYY-MM` month. */
export const yearMonthSchema = z
  .string()
  .regex(
    /^\d{4}-(0[1-9]|1[0-2])$/,
    "Expected a year-month date in YYYY-MM format",
  );

/** A four-digit year (`YYYY`). */
export const yearSchema = z
  .string()
  .regex(/^\d{4}$/, "Expected a four-digit year");

/** A year (`YYYY`) or year-month (`YYYY-MM`). */
export const yearOrYearMonthSchema = z
  .string()
  .regex(
    /^\d{4}(-(0[1-9]|1[0-2]))?$/,
    "Expected a year (YYYY) or year-month (YYYY-MM)",
  );

/** An ISO 8601 date (`YYYY-MM-DD`) or full timestamp. */
export const isoDateSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/,
    "Expected an ISO 8601 date (YYYY-MM-DD or a full timestamp)",
  );

/** A calendar date in `YYYY-MM-DD` format (no time or timezone). */
export const isoDateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected a date in YYYY-MM-DD format")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    );
  }, "Expected a real calendar date in YYYY-MM-DD format");

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
});

export type Link = z.infer<typeof linkSchema>;
