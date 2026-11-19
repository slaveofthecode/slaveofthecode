import type { ZodError } from "zod";
import { type Content, contentSchema } from "./schemas";

import cv from "../data/cv.json";

function formatIssues(error: ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

/** Validate raw CV data and throw a readable error on failure. */
export function parseContent(raw: unknown): Content {
  const result = contentSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`Invalid CV content:\n${formatIssues(result.error)}`);
  }
  return result.data;
}

/** The validated CV content from the committed JSON. */
export function getContent(): Content {
  return parseContent(cv);
}
