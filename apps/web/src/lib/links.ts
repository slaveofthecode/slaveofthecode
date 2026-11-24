export type IconName = "github" | "linkedin" | "globe";

/** Source repository of this project. */
export const REPO_URL = "https://github.com/slaveofthecode/slaveofthecode";

export function isSameOrigin(url: string, site: URL | undefined): boolean {
  if (!site) return false;
  try {
    return new URL(url).origin === site.origin;
  } catch {
    return false;
  }
}

/** Pick an icon for a profile link based on the URL host. */
export function iconName(url: string): IconName {
  let host: string;
  try {
    host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "globe";
  }
  if (host === "github.com" || host.endsWith(".github.com")) return "github";
  if (host === "linkedin.com" || host.endsWith(".linkedin.com"))
    return "linkedin";
  return "globe";
}
