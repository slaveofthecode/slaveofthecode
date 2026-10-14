---
name: verify-build
description: Required verification before finishing any change — builds and type-checks the Astro site. Use after editing any file under src/, config, README.md, or package.json, and before declaring a task done.
---

# Verify the build

**Required before finishing ANY change.** Never declare a task complete until the
site type-checks and builds.

## Commands (from repo root)

| Step | Command | Purpose |
|---|---|---|
| Type-check (fast) | `npx astro check` | Fail fast on TS/component errors |
| Full build | `npm run build` | `astro check` + `astro build`; also polls Tailwind/Sass compile |

Run both; `npm run build` is the gate. Local preview: `npm run dev`.

## Common failure patterns in this repo

- **`astro check` type errors** — often from `.astro` frontmatter or `getJsonCV()`
  return shape drift. Never hand-edit generated output; fix the source and
  regenerate (see repo README_ASTRO.md / docs for generated paths).
- **Path alias errors** — `@/` → `src/`, `@cv/` → `src/data/`. Missing or wrong
  alias breaks the import at type-check time.
- **Sass/Tailwind compile errors** — a stray `@import "reset.css"` outside
  `is:global` or a bad Tailwind class can fail the build; check `src/styles/`.
- **JSON shape drift** — a renamed/invalid `resume.json` key surfaces here (see
  `add-resume-entry` skill).

## After a green build

1. Update `.harness/memory/` per the `memory-update` skill.
2. Commit only on a feature branch (§6 of AGENTS.md); confirm before pushing.