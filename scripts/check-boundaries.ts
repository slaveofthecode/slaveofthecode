import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/**
 * Dependency-rule guard for the monorepo (see docs/architecture.md).
 *
 *   packages/content  -> no internal packages
 *   apps/web          -> @portfolio/content only
 *   apps/api          -> @portfolio/content only
 *   apps/web <-> apps/api -> never
 *
 * Fails on any declared internal dependency that is not allowed, and on any
 * internal import specifier found in source files that is not allowed. Workspaces
 * are discovered from the root package.json "workspaces" globs.
 */

const ROOT = join(import.meta.dir, "..");
const INTERNAL_PREFIX = "@portfolio/";

const ALLOWED_INTERNAL: Record<string, string[]> = {
  "@portfolio/content": [],
  "@portfolio/web": ["@portfolio/content"],
  "@portfolio/api": ["@portfolio/content"],
};

const SOURCE_EXTENSIONS = [
  ".ts",
  ".tsx",
  ".mts",
  ".cts",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".astro",
];
const IGNORED_DIRS = new Set([
  "node_modules",
  "dist",
  ".astro",
  ".git",
  "legacy",
  "content-source",
]);

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

function expandWorkspaces(globs: unknown): string[] {
  if (!Array.isArray(globs)) return [];
  const dirs = new Set<string>();
  for (const entry of globs) {
    if (typeof entry !== "string") continue;
    const base = entry.replace(/\/\*+$/, "");
    const absBase = join(ROOT, base);
    try {
      for (const name of readdirSync(absBase)) {
        if (statSync(join(absBase, name)).isDirectory())
          dirs.add(join(base, name));
      }
    } catch {
      // workspace glob base does not exist yet; ignore.
    }
  }
  return [...dirs].sort();
}

function walkSourceFiles(dir: string, acc: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      walkSourceFiles(full, acc);
    } else if (SOURCE_EXTENSIONS.some((ext) => entry.endsWith(ext))) {
      acc.push(full);
    }
  }
  return acc;
}

const IMPORT_RE =
  /(?:from\s*|import\s*|require\(\s*)["'](@portfolio\/[^"']+)["']/g;

function internalPackage(specifier: string): string | null {
  if (!specifier.startsWith(INTERNAL_PREFIX)) return null;
  const [scope, name] = specifier.split("/");
  return scope && name ? `${scope}/${name}` : specifier;
}

const rootPkg = readJson(join(ROOT, "package.json"));
const workspaceDirs = expandWorkspaces(rootPkg.workspaces);
const violations: string[] = [];

for (const dir of workspaceDirs) {
  const pkgPath = join(ROOT, dir, "package.json");
  let pkg: Record<string, unknown>;
  try {
    pkg = readJson(pkgPath);
  } catch {
    continue;
  }
  const name = String(pkg.name ?? dir);
  const allowed = ALLOWED_INTERNAL[name];
  if (!allowed) {
    violations.push(
      `${name}: unknown workspace (not in the dependency-rule table)`,
    );
    continue;
  }

  const declared = {
    ...((pkg.dependencies as Record<string, string>) ?? {}),
    ...((pkg.devDependencies as Record<string, string>) ?? {}),
  };
  for (const dep of Object.keys(declared)) {
    const depPkg = internalPackage(dep);
    if (depPkg && depPkg !== name && !allowed.includes(depPkg)) {
      violations.push(`${name}: declares forbidden dependency "${dep}"`);
    }
  }

  for (const file of walkSourceFiles(join(ROOT, dir))) {
    const content = readFileSync(file, "utf8");
    for (const match of content.matchAll(IMPORT_RE)) {
      const depPkg = internalPackage(match[1]);
      if (depPkg && depPkg !== name && !allowed.includes(depPkg)) {
        violations.push(
          `${name}: forbidden import "${match[1]}" in ${relative(ROOT, file)}`,
        );
      }
    }
  }
}

if (violations.length > 0) {
  console.error("check:boundaries failed:");
  for (const v of violations) console.error(`  - ${v}`);
  process.exit(1);
}

console.log(`check:boundaries OK (${workspaceDirs.length} workspaces scanned)`);
