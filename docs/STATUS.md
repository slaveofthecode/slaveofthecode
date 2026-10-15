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

- PR-7 (`feat/now-and-branding`) merged into `v2` (PR #13, merge `823a2db`, commit `877009f`),
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

- PR-8 (`feat/favicon-and-api-skeleton`) merged into `v2` (PR #14, merge `83f33a4`, commit
  `6210a7b`) — **combined** PR (human choice), all checks green (48 tests, 8 test files):
  - **Favicon from content:** new optional `profile.avatar` field (schema + `data/{en,es}` →
    `/portrait.png`). `BaseLayout` uses it for `<link rel="icon">`/`apple-touch-icon` (type by
    extension), else falls back to `/favicon.svg`. Removed the static `public/favicon.svg`.
  - **Initials fallback:** `src/lib/initials.ts` (first + last name → `GL`; single name → `G`) and
    `src/lib/favicon.ts` `renderInitialsIcon` (square SVG, escapes XML, token colors). New route
    `src/pages/favicon.svg.ts` serves the initials SVG. `Profile.astro` shows the avatar when
    present, else an initials monogram. Tests: `initials.test.ts` (5) + `favicon.test.ts` (2).
  - **`apps/api` skeleton:** layers `domain` (`health.ts`) → `application` (`get-health.ts`) →
    `adapters/http/router.ts` (web-standard `handleRequest(Request): Response`); `src/index.ts`
    re-exports it. Routes: `GET /health` → 200 `{status,service,timestamp}`, unknown → 404,
    non-GET `/health` → 405. `test/health.test.ts` (3). `apps/api/tsconfig.json` now includes
    `test/` with `types:["bun"]`. No Bun-only APIs; imports nothing internal.

- PR-9 (`feat/footer-links`) merged into `v2` (PR #15, merge `65214b6`, commit `b3a9581`), all
  checks green (48 tests), build OK:
  - Footer profile links (Portfolio/GitHub/LinkedIn) render as **icons only** (no text label),
    keeping `aria-label`/`title` for accessibility.
  - `Built with Astro` is now a link to the project repo (`REPO_URL` in `src/lib/links.ts`) with a
    new `heart-face` inline icon; i18n `footer.source` label (`Ver el código en GitHub` / `View
    the source on GitHub`).

- PR-10 (`feat/header-and-backtotop`) merged into `v2` (PR #16, merge `290dea8`, commit
  `653217a`), all checks green (48 tests):
  - Language switcher labels switched to abbreviations (superseded by PR-11).
  - `Header` became a **sticky** bar revealing the identity (avatar + name + headline) on scroll;
    `BackToTop.astro` bottom-left instant scroll-to-top.

- PR-11 (`feat/mobile-nav-and-labels`) merged into `v2` (PR #17, merge `c06cf26`, commit
  `5c4100b`), all checks green (48 tests), build + preview (`/`, `/es/`) → 200:
  - Language labels per locale: EN → `EN`/`SP`, ES → `IN`/`ES` (`language.{en,es}` in
    `src/i18n/{en,es}.ts`).
  - **Mobile menu:** added a `menu` icon + a `sm:hidden` hamburger button (`data-menu-toggle`,
    `aria-controls="mobile-nav"`, `aria-expanded`) and a collapsible mobile nav panel
    (`#mobile-nav`). JS in `Header.astro` toggles it (click, close on link click / Escape).
  - Moved the back-to-top button from bottom-left to **bottom-right** (`right-4`).

## In progress
- PR-12 (`chore/cutover-main`) branched from `v2`@`c06cf26` (uncommitted): removes `legacy/`
  (the v1 portfolio), cleans its references (`biome.json`, `scripts/check-boundaries.ts`,
  `AGENTS.md`, `docs/architecture.md`) and adds a root `vercel.json` so Vercel builds `apps/web`
  from the repo root. Target: merge into `main` to cut over the live site.

## Next steps
- Human: review + commit/push PR-12, then open the PR (base `main`, assignee @me) and merge.
- Human: review PR-4 JSON diff + answer `docs/ingest-notes.md` questions.
- After the cutover, per `docs/BOOTSTRAP.md` §12 (future roadmap, in order): (1) `POST /chat` +
  `LLMProvider` + streaming chat UI; (2) AI evals; (3) theme variants; (4) AWS deploy + budget
  alarm; (5) replace PDF ingest.

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
- PR-11: language switcher now uses locale-specific codes: EN locale → `EN`/`SP`, ES locale →
  `IN`/`ES` (per the human's latest instruction; supersedes PR-10's ENG/SPN).
- PR-8: human asked to combine the favicon/branding change with `feat/api-skeleton` in one PR
  (deliberate deviation from the one-feature-per-branch rule). The favicon is driven by the new
  optional `profile.avatar` content field rather than a filesystem check — the earlier
  `existsSync` approach broke because Astro bundles server code (wrong `import.meta.url`).

## Follow-ups / risks
- Privacy incident: the PDF blob `98825db2990add365133a536ba45c5a8cbd30c3d` was pushed
  while the repo was public. Open a GitHub Support ticket to purge it (blob may stay
  reachable by SHA until GC).
- Profile infrastructure stays at the repo root: `README.md`, `update-readme.js`,
  `.github/workflows/update-readme.yml`. Pre-existing issue: that workflow pushes directly to the
  default branch, which is protected (`GH013`).
- Privacy: `legacy/` (which held the old email/phone in `resume.json` and `Layout.astro`) is
  removed at cutover; that data still lives in git history and in the `v1` tag/release.
- Hosting: Vercel builds the repo root; the root `vercel.json` redirects the build to
  `apps/web`. If the dashboard has a manual Root Directory/Build override, set Root Directory to
  `apps/web` instead.
