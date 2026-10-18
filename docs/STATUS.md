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

- PR-12 (`chore/cutover-main`) merged into `main` (PR #19, merge `d1c617b`), all checks green:
  removed `legacy/` (the v1 portfolio), cleaned its references (`biome.json`,
  `scripts/check-boundaries.ts`, `AGENTS.md`, `docs/architecture.md`) and added a root
  `vercel.json` so Vercel builds `apps/web` from the repo root. `main` is now the new site.

## Done (continued)
Merged into `main` after the cutover (see PRs #20/#21):
- **PR #20** (merge `9453551`): `feat/cv-contact-and-polish` + PDF→JSON ingest.
- **PR #21** (merge `b3bf134`): `feat/section-rules-and-ci`. Details:

- PR-15 (`feat/section-rules-and-ci`) merged from `main`@`9453551`; commit `7981670`,
  all checks green (48 tests), build OK:
  - CI (`.github/workflows/ci.yml`): the "Lint" step already ran Biome (`bun run lint` =
    `biome check .`); renamed it **"Biome (lint + format)"** and dropped the stale `v2` trigger
    (only `main` now).
  - Ingest pipeline now runs `biome format --write packages/content/data` after parsing
    (`bun run ingest` → `…:extract` + `…:parse` + `format:data`). The generator's pretty-printed
    JSON didn't match Biome's formatter, so generated data files failed `bun run lint`; it now
    matches (compact short arrays). Content is unchanged.
  - `Experience.astro`: removed the **per-row** `border-b` (and `last:border-b-0`); the section-level
    `Section` top rule (`border-t`) is the only separator now.
  - `Profile.astro`: moved the contact block (location / email / phone) out of the header row to
    **below the summary**, left-aligned, directly above the links list.
  - Also normalized `data/{en,es}/now.json` formatting (the human's hand-added "Linkzen" item was
    missing a trailing newline, which failed Biome); content untouched.

- PR-13 (`feat/cv-contact-and-polish`) branched from `main`@`d1c617b`; committed `26a6cb8` +
  `0560753` and pushed, all checks green (48 tests), build OK:
  - Profile hero now shows the PDF header data: `name` (replaces a non-PDF tagline), `headline`,
    `location` (map-pin icon) and `email` (mail icon, `mailto:`); Portfolio/GitHub/LinkedIn keep
    their icons.
  - Added an `email` field to `data/{en,es}/profile.json` (en/es parity kept).
  - Removed the non-PDF hero text "Hey, I build reliable software" / "Hola, construyo software
    confiable" (`i18n.home`).
  - Experience: distinguished the date (uppercase + tracking), the role/company text and the
    highlights (left-rule block) from the tech chips.
  - Footer: "Built with Astro" → "Built with" / "Hecho con" + a heart icon.
  - Location links out to Google Maps (`…/maps/search/?api=1&query=…`).
  - Dark theme lightened (`--app-bg` `#141516` → `#202126`, surface/border/muted bumped) so
    badges/labels stand out.
  - Languages section: removed the per-row bottom rule.
  - Subtle hover affordances: experience rows and skills groups fade in a left-ward
    background gradient on hover (`hover:bg-linear-to-l from-transparent to-surface`) with
    breathing-room padding; Now cards highlight their border (`hover:border-accent`).
  - "Now" stays the single optional collection (rendered only when `now.json` is non-empty).

- PR-14 (PDF→JSON ingest + photo + language switch off) — committed `3457dfd` on PR-13's branch;
  PR #20 open (base `main`), all checks green (48 tests), build OK:
   - New `packages/content/scripts/ingest-resume.ts`, run via `bun run ingest:parse` (or
     `bun run ingest` = `ingest:extract` + `ingest:parse`). Deterministic parser (no AI): maps
     `content-source/resume.txt` → the schema. `now.json` never touched; validates against
     `contentSchema`; prints counts only (no PII).
   - **`data/en` is rebuilt from the PDF; `data/es` keeps its hand-made translations.** Entries are
     matched across locales by a stable natural key (existing ids are reused), fields the PDF can't
     provide are carried over (`profile.links`, cert `issuer`/`date`), and noisier PDF wording is
     ignored when it only differs by punctuation/casing from the committed value (so `UT (Jest)`,
     `.NET Web API`, etc. survive). Files are only rewritten when their content actually changes
     (stable-stringify compare), so re-running the same PDF is a **no-op**.
  - **Format-tolerant section detection** (the human's ask): sections are found by keyword in any
    order — summary/profile/about/objective, experience (incl. work/employment/additional/other/
    prior), skills/technical stack/competencies, education (incl. combined "Education &
    Certifications"), certifications, languages. Experience parser splits `Company` from `Role`
    (seniority/role/tech word heuristics), handles both `Company` + `Role DateRange` and
    `Role DateRange` layouts, joins wrapped bullet continuations, and separates bullets from the
    trailing `A - B - C` tech list. A table-style skills section ("Category | Technologies",
    even when PDF-flattened) is grouped by known category labels, with a single-group fallback.
    Education/certifications split a combined section by whether the block has a date range.
  - **Photo extraction** (`extract-resume.ts`): pulls the largest photo-like embedded image from
    the PDF and writes `apps/web/public/portrait.png` via a dependency-free PNG encoder
    (`node:zlib`); removes the file when the PDF has no photo. The parser sets `profile.avatar`
    only if that file exists, so a photo-less resume makes Header/Profile show the **initials**
    monogram and BaseLayout fall back to `/favicon.svg`.
  - New optional `profile.phone` (schema + `tel:` link + `phone` icon in `Profile.astro`, `cv.phone`
    i18n). `certifications[].issuer` made **optional** (the PDF has no issuer) and
    `Certifications.astro` renders issuer/date only when present.
  - Language switching disabled: `LanguageSwitcher` removed from `Header` (the `/es` page + i18n
    strings still exist for now). SEO `<title>`/description derive from the content. `Languages`
    renders only when non-empty.
  - Ran the pipeline against the current `resume.pdf` (Gustavo Lopez): 14 jobs, 7 skill groups,
    1 education entry, 2 certifications, 2 languages, photo → `portrait.png`.


## Done (continued)
- `chore/cleanup-v1` merged into `main` via **PR #22** (merge `d8bb01d`): post-cutover cleanup of
  v1 leftovers.
  - Profile `README.md` refreshed: About Me, Projects (adds this living-CV repo), Tech Stack and
    Connect updated; the daily-GIF block is untouched.
  - `.github/workflows/update-readme.yml` fixed: modern actions (`checkout@v4`, `setup-node@v4`,
    Node 20); the useless `npm install` dropped (`update-readme.js` only uses `fs`); and — because
    `main` is branch-protected — the job now **opens a PR and merges it** with the built-in
    `GITHUB_TOKEN` instead of pushing to `main` (fixes the old `GH013` failure). Repo setting
    `actions/permissions/workflow.can_approve_pull_request_reviews` set to `true` (was `false`).
  - Docs realigned to `main` (cutover done): `AGENTS.md` (title + rules 3/4 + rule 10),
    `docs/workflows/{start-feature,open-pr}.md`, `docs/architecture.md`; ADR-0001/ADR-0005 marked
    superseded. PR-template checklist updated to the new contact-data policy.

## Done (continued)
- **PR #24** (`fix/readme-gif-merge-method`, merge `0a01e27`): the daily-GIF job now runs
  `gh pr merge --merge` (the `rs-validation-pr` ruleset only allows merge commits). Same PR
  restored the `Profile.astro` hero: contact block (location/email/phone) + links list moved
  back **inside the header row, below the headline** (above the summary). 48 tests green.
- **PR #25 + #26**: GIF regenerated and validated end-to-end (run `38801980654` success; the
  README GIF object changed `iIqmM5tTjmpOB9mpbn → MD0svLSDeudszrNrp0 → xT1XGJEEQTOvq7IW4g`).
  The earlier "no change" was a stale local clone, not a failure.
- **Release v2.0.0** published with curated notes (monorepo, content-driven, i18n, ingest, CI,
  daily GIF). `main` advanced to `de4e29e`. Remote branches reduced to `main` (+ the bot's
  `chore/readme-gif`).
- **PR #28** (`feat/recruiter-chat`, merge `f0941e1`, merged 2026-10-16): the recruiter chat —
  RAG over a SQLite vector store (**ADR-0006 supersedes ADR-0004** context stuffing). 89 tests
  green. Details:
  - **RAG core** `apps/api/src`: `domain/rag.ts` (`buildChunks(getContent(locale))` → one
    chunk per profile/role/skill-group/language/education/cert/now item; `cosineSimilarity`;
    `RagStore`), `domain/embedding-provider.ts`, `adapters/llm/gemini-embeddings.ts`
    (`:batchEmbedContents`), `adapters/rag/sqlite-store.ts` (**sql.js** WASM — no native
    build; opens the committed snapshot; brute-force cosine per locale).
  - **Chat** `domain/{chat,system-prompt,llm-provider}`, `application/answer-question.ts`
    (embed query → top-k → generate), `adapters/llm/gemini-provider.ts`,
    `adapters/rate-limit/rate-limiter.ts` (in-memory only), `adapters/http/router.ts`
    (`POST /chat` + `GET /health`, CORS/limits/errors), `config.ts`, `dev.ts`, `api/index.ts`
    + `vercel.json` (bundles the sql.js WASM), `.env.example`.
  - **Ingestion** `apps/api/scripts/build-rag.ts` (`bun run build:rag`, needs `GEMINI_API_KEY`;
    `--empty` writes just the schema) → `apps/api/data/cv.sqlite` + `src/data/rag-db.ts`
    (base64 snapshot used at runtime). **Committed as an empty schema** — must be run with a key.
  - Deps: `sql.js` (+ `@types/sql.js`); Upstash removed (in-memory limiter only).
  - `apps/web`: `components/Chat.astro` island (browser `fetch` to `PUBLIC_API_URL`, client-side
    history, safe DOM, Enter-to-send), `chat` + `nav.chat` i18n (en/es), section in
    `pages/{index,es/index}.astro`, `env.d.ts` + `.env.example`.
  - Contract: `POST /chat` `{ messages, locale }` → `{ reply }`; errors
    `400/403/405/413/429/500/502`. Guardrails: answer only from retrieved excerpts, refuse
    off-topic, resist injection. Rate limit default 20/min per IP.
  - Model defaults set on 2026-10-16 (the old ones are retired for new projects):
    `GEMINI_MODEL=gemini-flash-latest` (alias), `GEMINI_EMBED_MODEL=gemini-embedding-001`
    (`text-embedding-004` is gone). Verified end-to-end with `bun run eval:chat`.
  - **Snapshot populated**: `bun run build:rag` wrote 56 chunks (28 en + 28 es) →
    `apps/api/data/cv.sqlite` + `apps/api/src/data/rag-db.ts` (no longer empty).
  - Docs: `ADR-0006` rewritten for RAG, `ADR-0004` marked superseded, `docs/architecture.md` updated.

## Done (continued)
- **PR #30** (`fix/vercel-api-routing`, merge `42c43e6`): API as its own Vercel project. The
  web calls `${PUBLIC_API_URL}/chat`, but the old single entry `apps/api/api/index.ts` only
  served `/api`, so those paths would 404 in production. Changed:
  - `apps/api/api/{chat,health}.ts` (one file per route; removed `api/index.ts`).
  - `apps/api/vercel.json`: `functions: {"api/*.ts"}` + `rewrites` mapping `/chat`→`/api/chat`
    and `/health`→`/api/health` (so `PUBLIC_API_URL` stays host-only, same as local dev).
  - Router strips a leading `/api` segment so both `/x` and `/api/x` work.
  - `docs/architecture.md` updated. Checks green (91 tests; smoke: `/health` and `/api/health`
    both 200).
- Vercel WASM fix (`fix/vercel-embed-sql-wasm`): the first production deploy 500'd
  (`FUNCTION_INVOCATION_FAILED`) on every request — `SqliteRagStore.open()` runs at startup and
  `require.resolve("sql.js/dist/sql-wasm.wasm")` failed because the hoisted wasm isn't bundled
  into the serverless function. Fix: embed the WASM as base64 (`scripts/embed-sql-wasm.ts` →
  `src/data/sql-wasm.ts`, `bun run build:wasm`; `sqlite-store.ts` decodes it into `wasmBinary`),
  so no filesystem resolution is needed. Dropped the fragile `includeFiles` from `vercel.json`.
  Reproduced + verified with an esbuild-bundled direct invocation under Node: `/health` 200,
  `/chat` 200 (grounded answer). All checks green (91 tests).

## Deploy status
- **PR #32** (`fix/api-local-chat-locales`, merge `5ac4917`): the API deploy at `a40ef40`
  still 500'd. Cause: Vercel leaves bare (node_modules) specifiers **external**, and
  `domain/chat.ts` imported `LOCALES` from the workspace package `@portfolio/content`
  (resolves to `.ts` source Node can't run). Fixed with a local `CHAT_LOCALES` + parity test.
- **PR #33** (`fix/api-vercel-esm-extensions`, merge `02e63ba`): after `5ac4917` the deploy still
  500'd. Real runtime error from Vercel logs: `ERR_MODULE_NOT_FOUND: Cannot find module
  '/var/task/apps/api/src/index' imported from /var/task/apps/api/api/health.js`. Vercel does
  **not** bundle Node functions — it transpiles each `.ts`→`.js` and runs them under Node ESM,
  which has no extensionless resolution. Fixed by adding explicit `.js` extensions to all 48
  relative imports across `apps/api/api` + `apps/api/src` (Bun/tsc map `.js`→`.ts`).
  Verified reproducing Vercel's pipeline: per-file transpile (`tsc`) + run emitted ESM under
  Node → `/health` 200, `/chat` 200; and `@vercel/nft` (with Vercel's TS-stripping) traces the
  whole `src/**` graph with no warnings. All checks green (92 tests). **Merged + deployed:**
  `GET https://slaveofthecode-api.vercel.app/health` → 200.
- CORS fix (human, Vercel dashboard, no code): after the API came up, the browser preflight for
  `/chat` failed (`No 'Access-Control-Allow-Origin'`), and `POST /chat` returned `403
  {"error":"forbidden_origin"}`. Cause: `ALLOWED_ORIGINS` on the **api** project was set to a
  value that did not include the web origin. Fixed by setting it to
  `https://slaveofthecode.vercel.app` (comma-separated host origins, no trailing slash, no `*`)
  and redeploying. Verified: preflight returns ACAO and the web chat calls succeed.
- **`fix/chat-truncation-and-markdown`** (PR #34, merge `3f40bc5`): two chat-quality fixes found
  after the chat went live:
  - **Truncated replies**: the default model (`gemini-flash-latest`) is a *thinking* model that
    counts reasoning tokens against `maxOutputTokens` (observed `thoughtsTokenCount: 478` of the
    600 budget → `finishReason: MAX_TOKENS`, answer cut mid-sentence). Fix:
    `gemini-provider.ts` now sends `generationConfig.thinkingConfig = { thinkingBudget: 0 }` and
    the default `maxOutputTokens` is 800. Verified against the real API: `finishReason: STOP`,
    full grounded answer.
  - **Markdown not rendered**: the bubble used `textContent`, so `**bold**`/bullets showed raw.
    Added `apps/web/src/lib/markdown.ts` — a dependency-free renderer that escapes HTML first
    (no injection), then renders fenced code, headings, nested ul/ol, bold, italic, inline code
    and http(s) links. `Chat.astro` renders assistant replies through it; global styles added.
  - Tests: `apps/web/test/markdown.test.ts` (10) + a `thinkingConfig` assertion in
    `apps/api/test/gemini-provider.test.ts`. All checks green (103 tests).

- **`feat/chat-launcher` (this branch)**: the chat was only reachable by scrolling to the bottom
  `#chat` section (or the "Ask AI" nav link), which felt unfriendly. Turned it into a floating
  widget:
  - `Chat.astro` is now a **launcher** (fixed pill, bottom-right, `bg-accent`) + a **panel**
    (fixed card, `role="dialog"`, header with a close button, scrollable messages, the same form).
    Open/close via `data-chat-toggle` (launcher), `data-chat-open` (triggers), the close button or
    Escape; the launcher sets `aria-expanded`/`aria-controls`. Panel hidden with CSS
    (`[data-chat-panel]` → `display:none`, `.is-open` → `flex`) instead of the `hidden` attribute
    (which Tailwind's display utilities would override).
  - Header nav "Ask AI" now opens the widget (`data-chat-open` button; desktop + mobile) instead
    of jumping to an anchor, and closes the mobile menu on click.
  - Removed the inline `<Section id="chat">` from both pages (the widget is the only chat now).
  - `Icon.astro` gains a `close` icon; `BackToTop` moved to `bottom-20` so it stacks above the
    launcher instead of overlapping it.
  - i18n: `chat.launcher` + `chat.close` (en/es parity enforced by the `Strings` type).
  - All checks green (103 tests); build verified (launcher/panel present, old `#chat` section gone,
    `[data-chat-panel]` CSS emitted).
  - **Follow-up (same branch)**: chat look & feel + sizing refinements:
    - **Greeting**: a static first assistant bubble (`chat.greeting`, e.g. "¿Querés preguntarme
      algo? 🤖"); not part of the API history.
    - **Avatars / first person**: the chat reads as Gustavo answering — assistant bubbles show the
      profile photo (`profile.avatar`) or an initials monogram (`initials(name)`) and are labelled
      with his name; the visitor bubble shows a generic person icon. `Chat.astro` takes
      `name`/`avatar` props (passed from both pages).
    - **Bigger input**: taller textarea (`min-h-11`) that auto-grows up to 10rem, larger send
      button; desktop panel widened to `sm:w-[30rem]`; placeholder reworded to the second person
      (`chat.placeholder`).
    - **Resizable panel**: a **custom top-left grip** (`[data-chat-resize]`, `cursor-nwse-resize`,
      desktop only) drags the panel from its top-left corner — the native CSS `resize` handle only
      sits bottom-right, which would be the wrong corner since the panel is anchored
      `right`/`bottom` and grows up-left. The grip uses pointer capture (clamped to
      `sm:min-w-[24rem]`/`sm:min-h-[18rem]` and `sm:max-w-[min(92vw,48rem)]`/`sm:max-h-[min(80vh,44rem)]`).
    - **Mobile**: the panel is a **bottom sheet** (`inset-x-0 bottom-0`, `rounded-t-card`,
      content-based height up to `max-h-[85svh]`, `env(safe-area-inset-bottom)` padding) instead of
      a floating card that covered almost the whole screen. While the panel is open the launcher
      pill is hidden (`[data-chat-panel].is-open ~ [data-chat-toggle]` → `display:none`) so it no
      longer overlaps the sheet.
    - `BackToTop` moved to the **bottom-left** (`bottom-6 left-4`) so it never collides with the
      launcher/panel. `Icon.astro`: added `close`; the temporary `robot` icon was removed.
    - **First-person system prompt** (`system-prompt.ts`): the persona now IS Gustavo ("You are
      Gustavo Lopez… ALWAYS reply in the FIRST PERSON"); added a STYLE EXAMPLE and a trailing
      reminder after the excerpts. Verified against the real API (en + es → "I have…"/"Tengo…").
      Note: the local `dev.ts` server had to be restarted because a stale instance kept the port
      (its process title is `bun dev.ts`, so `pkill -f 'apps/api/dev.ts'` missed it) — the prompt
      itself was never the problem.
    - Tests: 104 green (`system-prompt.test.ts` gained a first-person assertion).

## Done (continued)
- **PR #35** (`feat/chat-launcher`, merge `8984e6c`) + **PR #36** (merge `39e1756`):
  floating chat launcher + first-person replies, then CTA rename + contact links.
  - Widget: launcher pill + panel (`role="dialog"`), header "Ask AI" opens it, no `#chat`
    section. Greeting bubble, Gustavo avatars, resizable desktop panel, mobile bottom sheet.
  - CTA: `nav.chat` / `chat.launcher` → **"Ask me anything"** / **"Preguntame lo que quieras"**.
  - **Restored `profile.links`** (Portfolio / GitHub / LinkedIn) from historical data
    (`013e4db`); ingest had blanked them because `resume.txt` has labels but no URLs.
  - RAG profile chunk includes `Links: …`; snapshot 56 chunks. 104 tests.
- **PR #37** (`chore/readme-gif`, merge `99d03a2`): daily README GIF update.

## Done (continued)
- **`feat/resume-pdf-download` (P2, merged as PR #40):** let visitors download
  the CV. Human decision: serve a **committed public copy** of the original PDF (no PDF
  generation from content); AGENTS.md rule 10 updated accordingly.
  - `apps/web/public/resume.pdf` — byte-for-byte copy of `content-source/resume.pdf`;
    `packages/content/scripts/extract-resume.ts` now refreshes it on every `bun run ingest`
    (same pattern as `portrait.png`).
  - `Profile` hero gains a visible **"Download CV" / "Descargar CV"** accent button with a new
    `pdf` icon (`Icon.astro`) → `/resume.pdf` with `download="<First>_<Last>_resume.pdf"` from
    `src/lib/resume.ts` `resumeFilename(profile.name)` (unicode-safe; empty → `resume.pdf`).
  - i18n: `cv.download` (en/es parity kept). Tests: `apps/web/test/resume.test.ts` (5).

## Done (continued)
- **PR #40** (`feat/resume-pdf-download`, merge `26260ad`): P2 download the resume as PDF.
  Committed public copy `apps/web/public/resume.pdf` (policy decision, AGENTS.md rule 10
  updated), "Download CV" button in the hero, `bun run ingest` refreshes the copy, download
  filename `<First>_<Last>_resume.pdf` (`src/lib/resume.ts`). 109 tests green at merge.

- **`feat/chat-cost-cap` (P0, committed locally; PR pending):** hard, documented ceilings so
  nobody can drive unnecessary Gemini spend. Human decision: **no external storage/service** —
  in-memory limits + code caps, with the Google Cloud budget (pay-as-you-go, **USD 5 cap +
  alerts**, already configured by the human) as the hard ceiling. Documented in
  `docs/architecture.md` → "Chat cost caps".
  - **Order of guards, all before any Gemini call** (blocked = 0 spend): 413 body >16 KB →
    400 schema (12 msgs × 2000 chars) → 403 origin → **429 per-IP** (`RATE_LIMIT_MAX`
    default **10**/min) → **429 global daily** (`RATE_LIMIT_DAILY_MAX` default **200** per
    UTC day; checked after the per-IP guard so one abusive IP cannot burn everyone's budget)
    → generate with `maxOutputTokens` **hard-clamped to 800** + `thinkingBudget: 0`.
  - New `InMemoryDailyLimiter` (UTC-midnight window); `dailyLimiter` added to `HandlerDeps`.
    Chat UI distinguishes `daily_limit_reached` → new `chat.rateLimitedDay` string (en/es).
  - Tests: daily limiter (3), config defaults/overrides (3), router 429-daily-without-LLM-call
    + blocked-IP-does-not-burn-daily-budget (2), token clamp (1) → **118 green**.
  - `.env.example` documents the three `RATE_*` vars (optional overrides).
  - `GEMINI_API_KEY` **rotated** (human, 2026-10-18) after the earlier exposure; the old key
    is dead. Only optional extras remain: Vercel WAF rule on `/api/chat`, Turnstile.

## Done (continued)
- **PR #41** (`feat/chat-cost-cap`, merge `4f0526d`): P0 chat cost caps — merged into `main`.
  All guards before any Gemini call (413/400/403/429 per-IP/429 daily → 800 token clamp).
  `InMemoryDailyLimiter` (UTC-midnight), `dailyLimiter` in `HandlerDeps`, `chat.rateLimitedDay`
  i18n. 118 tests green. `GEMINI_API_KEY` rotated by human (2026-10-18).

- **PR #42** (`feat/chat-retrieval-profile`, merge `5f1696c`): always-ground the profile
  chunk so contact questions are answered. Contact questions
  ("Can I send you an email?", "what is your email?", "how can I contact you?") returned
  "I don't have my email address listed in the current context of my CV" because the
  `en:profile` chunk (name, location, email, phone, links) ranked **10th–19th** on
  contact-related queries — outside the `retrieveK: 6` window — so the system prompt
  never carried the contact data. Fix:
  - `RagStore` gains `getChunk(id)` (`SqliteRagStore` + `FakeStore`).
  - `answerQuestion` always prepends the `profile` chunk to the retrieved hits (when
    not already present), independent of vector ranking.
  - Verified live: "Can I send you an email?" → "Yes, absolutely! You can reach me at
    gml.gustavoml@gmail.com"; Spanish and off-topic/injection cases still correct.
  - Tests: +2 eval (profile always grounded, no duplicate) +2 sqlite (`getChunk`) → **122 green**.
  - `docs/architecture.md` updated (profile grounding guarantee).

- **UI (violet-accent) — rolled back:** attempted a violet-accent UI refresh (tokens,
  component hovers, brand-colored icons). Human reviewed and preferred the original
  grayscale look; all web changes reverted (`git restore apps/web/...`). The
  `feat/ui-grayscale-backup` branch still holds the abandoned work if needed later.

- **`feat/grayscale-ui` (this branch):** grayscale-only UI refresh, tokens only (no
  component colors). Pure neutral ramp `--gray-50..950` in `tokens.css`. Extremes:
  `--app-bg` is pure black `#000000` in dark / pure white `#ffffff` in light; `--app-fg`
  is `#fafafa` / `#0a0a0a`.
  - New role tokens: `--app-hover` (uniform hover fill), `--app-subtle` (fainter meta
    text), `--app-header` (header, deliberately **not** the extreme bg; `#0f0f0f` /
    `#fbfbfb`) and `--app-chat` (chat panel darker than a surface but a touch lighter
    than the page bg: `#0d0d0d` / `#f7f7f7`). Mapped in `global.css` to `bg-hover`,
    `text-subtle`, `bg-header`, `bg-chat`.
  - Applied: header `bg-bg/80` → `bg-header/80`; chat panel `bg-surface` → `bg-chat`;
    Experience + Skills row hover gradient → uniform `hover:bg-hover`; Experience dates
    `text-subtle` → `text-muted` (more weight); Download CV button `bg-accent` (loud) →
    `border + bg-surface + text-fg` (soft); Certifications name is no longer a link —
    a separate `Validate`/`Validar` link (`t.certifications.validate`) points at the
    credential URL.
  - 122 tests green; build emits `.bg-header`, `.bg-chat`, `.hover:bg-hover`,
    `.text-subtle`. Process change: STATUS.md edits now ride in the feature branch
    (see rule note below).

## Next steps
- **Local backlog (NOT committed):** `docs/backlog.local.md` (gitignored). Remaining, top first:
  **P1 re-enable the EN/ES language switcher**, **P3 secure admin panel to upload
  `resume.pdf`** (ingest + RAG rebuild + redeploy).
- **`feat/grayscale-ui` awaiting human review** (visual pass via `bun run dev`); then human
  commit/push + PR.
- **Process (from 2026-10-18):** the STATUS.md update for a change goes in that change's own
  branch, so it never lingers uncommitted without an owner. PR #42 is merged (`5f1696c`).
- **Human actions:** none pending. Optional later: Vercel WAF rule on `/api/chat`, Turnstile.
- Production is live: web `https://slaveofthecode.vercel.app/`, API
  `https://slaveofthecode-api.vercel.app/`. Vercel projects (from the same repo): **web** uses
  the root `vercel.json` (builds `apps/web`), **api** uses Root Directory `apps/api`. API env:
  `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-flash-latest`, `GEMINI_EMBED_MODEL=gemini-embedding-001`,
  `ALLOWED_ORIGINS=https://slaveofthecode.vercel.app`. Web env: `PUBLIC_API_URL` (host only).
- Human: after replacing `content-source/resume.pdf`, run `bun run ingest` (and then
  `bun run build:rag`) locally and commit the regenerated data + snapshot.
- Roadmap per `docs/BOOTSTRAP.md` §12: (2) AI evals expansion; (3) theme variants; (4) AWS deploy +
  budget alarm; (5) replace PDF ingest.

## Open decisions
- Ingest locales (revised): `data/en` is rebuilt from the PDF; `data/es` preserves the hand-made
  Spanish translations (matched by id / natural key) plus any field the PDF can't provide.
  Language switching is disabled for now.
- Contact data: the PDF→JSON ingest publishes whatever the resume header contains (location,
  phone, email, links) — the human explicitly asked to show any PDF data (PR-14); this supersedes
  the earlier "phone/address never" rule for PDF-derived content.
- Certifications: `issuer` is optional (the current PDF has none). Education/certifications blocks
  are told apart by the presence of a date range within a combined section.
- Future backend: the plan is to move the backend to a separate FastAPI/Python service. The
  structure already supports it — `apps/web` ↔ `apps/api` only ever talk over HTTP and
  `packages/content` JSON is the shared contract — so `apps/api` can be replaced/removed without
  touching `apps/web`.

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
- Privacy: the PDF-derived contact data (location, email, and phone when present) is
  intentionally public — the human wants ALL `resume.pdf` data shown. The human decided NOT to
  purge the historical PDF blob `98825db…` (it only exposes the job-hunting email). Git history is
  not rewritten.
- Ref cleanup: all merged v1 feature branches + `v1`/`v2` are deleted (refs only; `v2`'s branch
  protection was removed first). The `legacy/`/PDF objects stay reachable by SHA in history until
  GC. The `v1.0.0` tag/release is kept, and main's history still contains the v1 commits
  (`809a7ca`), so v1 is recoverable via `git checkout v1.0.0`.
- GIF workflow: it merges via PR using the built-in `GITHUB_TOKEN`; requires the repo setting
  `can_approve_pull_request_reviews: true` (set) and `contents: write` + `pull-requests: write`
  (declared in the workflow). The `rs-validation-pr` ruleset only allows **merge commits**, so the
  job must use `gh pr merge --merge`. It commits a new GIF roughly once per day.
- Hosting: two Vercel projects from the same repo (ADR-0006). The **web** project uses the root
  `vercel.json` (SINGLE source of its build config — no dashboard Build overrides) and builds
  `apps/web`. The **api** project uses Root Directory `apps/api` + `apps/api/vercel.json`.
