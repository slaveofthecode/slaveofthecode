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
- PR-4 (`feat/ingest-resume`) merged into `v2` (PR #10, merge `ae33d2c`, commit `013e4db`):
  - `packages/content/scripts/extract-resume.ts` (unpdf dev-dep) → `content-source/resume.txt`;
    root script `ingest:extract`. Node-compatible file resolution; logs only page/char counts.
  - Real `data/en/*.json` from the PDF text (profile, 14 experience entries, 7 skill groups,
    2 languages, education, certifications); `data/es/*.json` is a **draft translation**
    (non-text fields identical — enforced by parity tests).
  - Schema tweaks to fit real data: `experience[].summary` optional; `education[]` dates and
    `certifications[].date` accept `YYYY` or `YYYY-MM`; new `certifications[]` collection.
  - `docs/ingest-notes.md` with open questions for the human. `now[]` stays mock until PR-7.
  - 30 tests total.

- PR-5 (`feat/web-base`) merged into `v2` (PR #11, merge `edd00d9`, commit `5841501`):
  - Astro 7 + Tailwind 4 static app: i18n (`/` en, `/es/` es), theme tokens (light/dark via
    `data-theme`, CSS vars `--app-*` mapped through `@theme inline`), `BaseLayout` SEO
    (canonical/hreflang/OG), no-flash theme script, skip link, `Header` (LanguageSwitcher +
    ThemeToggle), `Footer`, placeholder home pages, `favicon.svg`.
  - Fonts via `@fontsource/*` **latin subsets only** (8 woff/woff2 assets).
  - Two harness fixes needed for the suite to pass:
    - `scripts/check-boundaries.ts` had a bug: `internalPackage()` returned only `@portfolio`
      instead of `@portfolio/content`, so any internal import was flagged. Fixed to join the
      scope + name; guard re-verified to still fail on a forbidden `web → api` import.
    - Bun does not materialize `@emnapi/core`'s bundled transitive `@emnapi/wasi-threads`, so
      `astro check` failed to import. Workaround: root devDependency `@emnapi/wasi-threads`
      (proposal logged in `docs/learnings.md`).

- PR-6 (`feat/web-cv-sections`) merged into `v2` (PR #12, commit `677dc51`), all checks green
  (35 tests):
  - Renders every CV section from `@portfolio/content` (no data touched): hero `Profile` plus
    `Experience`, `Skills`, `Languages`, `Education`, `Certifications`, each in a `Section`
    wrapper (anchor `id`, `aria-labelledby`, `h2`).
  - `Header` gets anchor nav (`experience`/`skills`/`education`, hidden on mobile).
  - `src/lib/dates.ts` formats `YYYY` / `YYYY-MM` per locale (`formatPoint`/`formatRange`);
    `Present`/`Actualidad` label from UI strings; `apps/web/test/dates.test.ts` (5 tests).
  - i18n: added `nav.certifications` + `cv.{links,present}`; removed unused `home.intro`.
  - `apps/web/tsconfig.json` now includes `test/` and the `bun` types so tests typecheck.
  - Build renders both locales; preview smoke test `/` and `/es/` → 200.

## In progress
- PR-7 (`feat/now-and-branding`), uncommitted, awaiting human commit/push. From `v2`@`677dc51`,
  all checks green (38 tests), build + preview smoke (`/`, `/es/`, `/portrait.png`) → 200:
  - Fonts swapped to **Chakra Petch** (headings) + **Space Mono** (body/mono); removed Zen Kaku
    Gothic New, Cutive Mono, Rubik Mono One; latin subsets only.
  - Portrait `apps/web/public/portrait.png` (108×108, extracted from the PDF) shown as a round
    avatar in the `Profile` hero.
  - New `components/Icon.astro` (inline SVG github/linkedin/globe/thinking; no new dep) driven by
    `src/lib/links.ts` `iconName(url)`; used in `Profile` + `Footer` links. `links.test.ts`.
  - New `sections/Now.astro` + `NowCard` markup: progress bar (`role="progressbar"` +
    `aria-valuenow`), status badge, tags, links, "Updated <mes año>". `Section` gained an optional
    `icon`; the Now heading uses a "thinking" icon.
  - Real `now[]` in `data/en` + `data/es` (Commit Academy AWS/Cloud course, progress 11). EN text
    is my translation of the human-provided Spanish; human to review wording.
  - i18n: `nav.now` short (`Now`/`Ahora`) for the header anchor; `now.heading` long
    ("What I'm working on now" / “¿En qué ando ahora?”); `now.{updated,status,kind}` labels.
  - `apps/web/test/links.test.ts` (3 tests) for `iconName`.

## Next steps
- Human: review + commit/push PR-7, then open the PR (base `v2`, assignee @me).
- Human: review PR-4 JSON diff + answer `docs/ingest-notes.md` questions.
- PR-8 (stretch) `feat/api-skeleton`.

## Open decisions
- Resume source is English → `data/en/*.json` authoritative, `data/es/*` draft (human to
  review wording).
- Contact data: **email NOT published** (confirmed); phone/address never. Profile links
  published: Portfolio, GitHub, LinkedIn.
- Certifications: new `certifications[]` collection (approved). MCP vs HTML5 Specialist
  Credly URL ambiguity → `docs/ingest-notes.md`.
- Visual direction: keep the current identity as a base but with a refreshed look.
- Branding (PR-7): Chakra Petch + Space Mono; portrait from the PDF. "Now" section labelled
  "What I'm working on now" / "¿En qué ando ahora?" with a thinking icon; real `now[]` item
  (Commit Academy cloud/AWS course). en text is a translation of the human-authored es.

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
