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

## In progress
- PR-3 (`feat/content-schemas`, from `v2`@`f040ba1`) awaiting human commit + push, then the
  PR (base `v2`). Do not merge. Implemented, all checks green:
  - `packages/content/src/schemas/{common,profile,experience,skills,languages,education,now,index}.ts`
    (Zod 3.25; `yearMonth` YYYY-MM, ISO dates, `linkSchema`, `contentSchema` with
    `education` defaulting to `[]`).
  - `packages/content/src/loader.ts`: `getContent(locale)` / `parseContent(locale, raw)`
    using **static JSON imports** (no `fs`), readable validation errors; `LOCALES` const.
  - `packages/content/src/index.ts` re-exports schemas, types, loader.
  - `packages/content/data/{en,es}/*.json`: obviously-fake placeholder fixtures
    (`Jane Doe`, `Example Co`) — no real or personal data.
  - `packages/content/test/{schemas,parity,loader}.test.ts`: 22 tests (valid/invalid cases,
    en/es id/order/keys/non-text parity, loader error messages).
  - Deps: `zod@^3.23.8` in `packages/content`; `@types/bun` in root devDependencies;
    `packages/content/tsconfig.json` includes `test`/`data`, `types: ["bun"]`.

## Next steps
- PR-4 `feat/ingest-resume`: `extract-resume.ts` + `ingest:extract`, real `data/en/*.json`,
  draft `data/es/*.json`, `docs/ingest-notes.md`. Replace the PR-3 placeholder fixtures.
- PR-5..PR-7 web: base (Astro/Tailwind/i18n/tema), CV sections, Now section.
- PR-8 (stretch) `feat/api-skeleton`.

## Open decisions
- Resume source is in English → `data/en/*.json` is the source language, `data/es/*`
  is a draft translation (confirm at PR-4).
- The human asked that the public site show the same contact info as the PDF. Confirm
  at PR-4 which fields (email/LinkedIn/GitHub) are safe to publish; phone/address stay
  out by default (public repo).
- Visual direction: keep the current identity as a base but with a refreshed look.
- "Now" items: first iteration uses clearly-marked mock data (replace later with real ones).

## Follow-ups / risks
- Privacy incident: the PDF blob `98825db2990add365133a536ba45c5a8cbd30c3d` was pushed
  while the repo was public. Open a GitHub Support ticket to purge it (blob may stay
  reachable by SHA until GC).
- Profile infrastructure stays at the repo root (not `legacy/`): `README.md`,
  `update-readme.js`, `.github/workflows/update-readme.yml`. Pre-existing issue: that
  workflow pushes directly to the default branch, which is protected (`GH013`).
