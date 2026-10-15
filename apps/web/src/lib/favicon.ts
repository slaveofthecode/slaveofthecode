function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Square SVG favicon with up to two initials. Colors mirror the theme tokens
 * (`--app-accent` / `--app-accent-fg`) since a standalone asset cannot read CSS
 * variables.
 */
export function renderInitialsIcon(
  text: string,
  { background = "#141516", foreground = "#f4f4f5" } = {},
): string {
  const label = escapeXml(text.slice(0, 2));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">
  <rect width="64" height="64" rx="12" fill="${background}" />
  <text x="32" y="34" font-family="'Chakra Petch', system-ui, sans-serif" font-size="32" font-weight="700" fill="${foreground}" text-anchor="middle" dominant-baseline="central">${label}</text>
</svg>
`;
}
