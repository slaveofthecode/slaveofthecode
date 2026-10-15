/**
 * Initials from a display name: first letter of the first name plus the first
 * letter of the last name (e.g. "Gustavo Lopez" -> "GL"). A single-word name
 * yields a single letter. Returns "" for an empty/whitespace name.
 */
export function initials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((part) => part.length > 0);
  const first = parts.at(0);
  const last = parts.at(-1);
  if (!first || !last) return "";
  const rest = parts.length > 1 ? last.charAt(0) : "";
  return `${first.charAt(0)}${rest}`.toUpperCase();
}
