/**
 * Suggested download filename for the public resume copy served at
 * `/resume.pdf`, e.g. "Gustavo Lopez" → "Gustavo_Lopez_resume.pdf".
 * Keeps unicode letters/digits; any other run becomes a single "_".
 */
export function resumeFilename(name: string): string {
  const words = name
    .trim()
    .split(/\s+/)
    .map((word) =>
      word.replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_+|_+$/g, ""),
    )
    .filter(Boolean);
  if (words.length === 0) return "resume.pdf";
  return `${words.join("_")}_resume.pdf`;
}
