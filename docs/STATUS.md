# STATUS

Agent memory. Read at the start of every session; update at the end of every task.

## Done
- PR-1 (`chore/harness`) merged into `v2` (PR #7, merge `8c73048`): v2 harness —
  `AGENTS.md`, `CLAUDE.md`, root `opencode.json`, `docs/workflows/*`,
  `.opencode/command/` + `.claude/commands/` wrappers, `.github/pull_request_template.md`,
  `docs/{STATUS,learnings,architecture}.md`, `docs/decisions/ADR-0001..0005`, and
  `BOOTSTRAP.md` moved to `docs/BOOTSTRAP.md`.
- Privacy fix: `content-source/` gitignored; the resume PDF was removed from the
  branch history and `chore/harness` was rewritten to a single clean commit.
- PR-2 (`chore/workspace-scaffold`) merged into `v2` (PR #8, merge `f040ba1`, commit
  `7320aa8`): moved the v1 Astro portfolio to `legacy/` (git mv); deleted the v1 harness
  (`.harness/`, v1 subagents, `.cursor`); created Bun workspaces (`apps/*`, `packages/*`),
  root scripts (`--filter`), `tsconfig.base.json`, `biome.json`, empty
  `@portfolio/{content,web,api}` with `package.json`/`tsconfig.json`/`AGENTS.md`,
  `scripts/check-boundaries.ts` and `.github/workflows/ci.yml`. `bun install` + lint +
  typecheck + test + build + check:boundaries pass; the boundary script was proven to fail
  on a forbidden `@portfolio/web` → `@portfolio/api` import, then reverted.

- PR-3 (`feat/content-schemas`) merged into `v2` (PR #9, merge `8ebb3d1`, commit `5d3ffad`):
  Zod schemas, `getContent(locale)` loader (static JSON imports, no `fs`), placeholder
  fixtures, 22 schema + en/es parity + loader tests. `zod@^3.23.8`; `@types/bun` at root.

## In progress
- PR-4 (`feat/ingest-resume`, from `v2`@`8ebb3d1`) awaiting human commit + push, then the
  PR (base `v2`). Do not merge. Implemented, all checks green (30 tests):
  - `packages/content/scripts/extract-resume.ts` (unpdf dev-dep) → `content-source/resume.txt`;
    root script `ingest:extract`. Node-compatible file resolution; logs only page/char counts.
  - Real `data/en/*.json` from the PDF text (profile, 14 experience entries, 7 skill groups,
    2 languages, education, certifications); `data/es/*.json` is a **draft translation**
    (non-text fields identical — enforced by parity tests).
  - Schema tweaks to fit real data: `experience[].summary` optional; `education[]` dates and
    `certifications[].date` accept `YYYY` or `YYYY-MM`; new `certifications[]` collection.
  - `docs/ingest-notes.md` with open questions for the human.
  - `now[]` stays mock until PR-7.

## Next steps
- Human: review PR-4 JSON diff + answer `docs/ingest-notes.md`.
- PR-5..PR-7 web: base (Astro/Tailwind/i18n/theme), CV sections, Now section.
- PR-8 (stretch) `feat/api-skeleton`.

## Open decisions
- Resume source is English → `data/en/*.json` authoritative, `data/es/*` draft (human to
  review wording).
- Contact data: **email NOT published** (confirmed); phone/address never. Profile links
  published: Portfolio, GitHub, LinkedIn.
- Certifications: new `certifications[]` collection (approved). MCP vs HTML5 Specialist
  Credly URL ambiguity → `docs/ingest-notes.md`.
- Visual direction: keep the current identity as a base but with a refreshed look.
- "Now" items: first iteration uses clearly-marked mock data (replace in PR-7).

## Follow-ups / risks
- Privacy incident: the PDF blob `98825db2990add365133a536ba45c5a8cbd30c3d` was pushed
  while the repo was public. Open a GitHub Support ticket to purge it (blob may stay
  reachable by SHA until GC).
- Profile infrastructure stays at the repo root (not `legacy/`): `README.md`,
  `update-readme.js`, `.github/workflows/update-readme.yml`. Pre-existing issue: that
  workflow pushes directly to the default branch, which is protected (`GH013`).
- Pre-existing privacy: `legacy/src/data/resume.json` and `legacy/src/layouts/Layout.astro`
  still contain the old email/phone (moved in PR-2). Decide whether to scrub when `legacy/`
  is removed at cutover (out of scope for PR-4).
