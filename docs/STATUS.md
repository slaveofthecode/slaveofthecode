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


## In progress
- `chore/cleanup-v1` (branched from `main`@`b3bf134`): post-cutover cleanup of v1 leftovers.
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

## Next steps
- Human: review this branch, push, and open the PR (base `main`).
- Human: after this merges, test the GIF job once with `gh workflow run update-readme.yml`.
- Human: delete the merged v1 feature branches + `v1`/`v2` (refs only; keep the `v1.0.0`
  tag/release — the human chose to keep it).
- Human: after replacing `content-source/resume.pdf`, run `bun run ingest` locally and commit the
  regenerated `packages/content/data/**` + `apps/web/public/portrait.png` (the PDF is gitignored, so
  CI/Vercel only see the JSON/PNG).
- Roadmap per `docs/BOOTSTRAP.md` §12: (1) `POST /chat` + `LLMProvider` + streaming chat UI;
  (2) AI evals; (3) theme variants; (4) AWS deploy + budget alarm; (5) replace PDF ingest.

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
- Ref cleanup: `v1`/`v2` and the merged v1 feature branches are deleted (refs only); the
  `legacy/`/PDF objects stay reachable by SHA in history until GC. The `v1.0.0` tag/release is kept.
- GIF workflow: it now merges via PR using the built-in `GITHUB_TOKEN`; requires the repo setting
  `can_approve_pull_request_reviews: true` (set) and `contents: write` + `pull-requests: write`
  (declared in the workflow). It will commit a new GIF roughly once per day.
- Hosting: Vercel builds the repo root; the root `vercel.json` redirects the build to `apps/web`
  and is the SINGLE source of build config — do not add Root Directory/Build overrides in the
  dashboard.
