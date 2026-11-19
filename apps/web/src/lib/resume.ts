/**
 * Suggested download filename for a generated CV PDF, e.g. "Gustavo Lopez" →
 * "Gustavo_Lopez_resume.pdf" (or "_resume_ats.pdf" for the ATS variant).
 * Keeps unicode letters/digits; any other run becomes a single "_".
 */
export function resumeFilename(
  name: string,
  variant: "designed" | "ats" = "designed",
): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, ""),
    )
    .filter(Boolean);
  const suffix = variant === "ats" ? "resume_ats.pdf" : "resume.pdf";
  if (words.length === 0) return suffix;
  return `${words.join("_")}_${suffix}`;
}
