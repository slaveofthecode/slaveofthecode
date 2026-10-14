# BOOTSTRAP.md — Entry point for the agent

> You are an AI coding agent (OpenCode, but this file must work for Claude Code, Cursor, Codex, etc.).
> Read this ENTIRE file before touching anything. Then follow **Section 11 (Roadmap)** one PR at a time.
> **Language rule:** talk to the human in **Spanish**. Write code, docs, commits, branch names and PRs in **English**.

---

## 0. How to use this file

1. Read it fully.
2. Do the "Questions to ask the human" in Section 13 BEFORE writing code.
3. Execute Roadmap steps in order. **One step = one branch = one PR.** After each step, STOP and wait for the human (see Section 4, rule 3).
4. In step PR-1 you will create the permanent harness (`AGENTS.md`, etc.). From then on, `AGENTS.md` is the source of truth for rules and this file becomes `docs/BOOTSTRAP.md` (historical reference). Do not keep two competing sets of rules.

---

## 1. Context and goal

The human's GitHub handle is `slaveofthecode`. Repo: https://github.com/slaveofthecode/slaveofthecode (currently a live portfolio built with Astro + TailwindCSS, deployed on Vercel at https://slaveofthecode.vercel.app/). **`main` must stay untouched and in production until a stable v2 exists.**

We are building **v2**: a "living CV" website that shows roughly what LinkedIn shows:
- Profile / presentation
- Work experience
- Skills
- Languages
- Education (if present in the source)
- **"What I'm working on now"** section (current courses/projects with % progress and links) ← **the target for the first 3 days**

Later (NOT in the first iteration, but the architecture must make them easy):
- An **AI chat** where recruiters ask questions; answers come ONLY from the CV data.
- A theme switch: besides light/dark, a "CLI / AI-terminal" look and a "normal / recruiter-friendly" look.
- Deployment on AWS at near-zero cost (S3 + CloudFront for the web; Lambda for the API).

Time budget: **3 days** from 2026-10-14. Minimum goal: everything up to and including the "Now" section. Everything else is stretch/roadmap.

---

## 2. Decisions already made (do not re-debate; propose changes via an ADR)

| Topic | Decision |
|---|---|
| Repo strategy | Same repo. Long-lived branch **`v2`**. Features branch from `v2` and PR into `v2`. At the end, a human-driven PR `v2 → main` replaces the old site. Never touch `main` or `v2` directly. |
| Package manager / runtime | **Bun** (install, scripts, tests via `bun test`). Bun workspaces. |
| Language | **TypeScript (strict)** everywhere. |
| Frontend | `apps/web`: **Astro + TailwindCSS**, static output (`output: 'static'`). |
| Backend | `apps/api`: **Node.js-compatible TypeScript** (web-standard `Request`/`Response`). It will run on AWS Lambda (Node runtime). **No Bun-only APIs** in `apps/api` or in any package it imports. |
| Front/back independence | Separate apps, separate `package.json`/`tsconfig`/scripts/`AGENTS.md`. They NEVER import each other. They only share `packages/content`. |
| Source of truth | `packages/content`: validated JSON (Zod). The website, the chat and any generated PDF read from it. |
| Initial data source | A **PDF resume** the human already uses. It is only an **input to an ingest step**, never read at runtime (see Section 7). |
| i18n | English by default (`/`), Spanish under `/es/`. |
| Chat design (future) | **Context stuffing**, not RAG: the whole CV (a few thousand tokens) goes into the system prompt. No vector DB. LLM must be free-tier; hidden behind an `LLMProvider` interface. Verify current free limits when we get there. |
| Hosting (future) | Web: S3 + CloudFront. API: Lambda (Function URL or API Gateway). Budget alarm + rate limiting are mandatory before exposing the chat. Meanwhile: Vercel (a *second* Vercel project, Root Directory `apps/web`, to not disturb production). |
| Linter/formatter | **Biome** (single tool). |
| Tests | `bun test`. Unit tests for schemas, loader, i18n parity. AI evals only for the chat, later. |
| CI | GitHub Actions: install, lint, typecheck, test, build on every PR. |

---

## 3. Human prerequisites (the human does these; verify with the human, don't assume)

- [ ] Branch `v2` exists on origin, created from an up-to-date `main`.
- [ ] Branch protection on `main` and `v2`: PR required, no direct pushes, `enforce_admins: true`. (This is the REAL barrier; the rules below are the soft layer.)
- [ ] `gh` (GitHub CLI) is installed and authenticated.
- [ ] Bun is installed (`bun --version`).
- [ ] The PDF resume is placed at `content-source/resume.pdf` (local only, gitignored — see Section 7).

If any item is missing, tell the human and wait.

---

## 4. Operating rules (non-negotiable)

1. **Never run** `git commit`, `git push`, `git merge`, `git push --force`, `git reset --hard`, `gh pr merge`. The human reviews the changes and does commit + push.
2. **Never work on `main` or `v2` directly.** Every feature starts from an **up-to-date `v2`**: `git fetch origin && git checkout v2 && git pull --ff-only && git checkout -b <type>/<short-name>`. Branch types: `feat/`, `fix/`, `chore/`, `docs/`.
3. **End-of-task protocol.** When a step is done, you must:
   1. Run `bun run lint && bun run typecheck && bun test && bun run build` (once those exist) and report results honestly, including anything you could not run.
   2. Summarize what changed (files and why), in Spanish.
   3. Propose a Conventional Commit message.
   4. Print the exact commands for the human: `git add -A && git commit -m "..." && git push -u origin <branch>`.
   5. **STOP.** Wait for the human to say they pushed.
4. **Opening the PR (only after the human pushed).** Follow `docs/workflows/open-pr.md`: `gh pr create --base v2 --assignee @me --title ... --body ...`. Never merge it.
5. **Never invent CV data.** Facts come only from the PDF/ingest or from the human. If something is unclear or missing, write it into `docs/ingest-notes.md` as a question for the human; do not guess.
6. **Small, focused changes.** One feature per branch. No unrelated refactors. No new dependency without stating why in the PR description.
7. **Theme tokens only.** No hard-coded colors/spacing in components; use CSS variables / Tailwind tokens.
8. **Memory.** At the start of every session read `docs/STATUS.md`. At the end of every task update it (Done / In progress / Next steps / Open decisions).
9. **Self-learning with human approval.** If you learn something reusable (a pitfall, a convention), append a proposal to `docs/learnings.md`. Do NOT edit `AGENTS.md` on your own; the human promotes learnings.
10. **Don't expose personal data.** The repo is public. Never commit the PDF, phone numbers, home address or private emails. See Section 7.
11. **Verify tool syntax.** Config formats for OpenCode/Bun/Astro/Tailwind change between versions. Check the installed version's docs before writing config; don't rely on memory.

---

## 5. Target architecture

```
/
├─ AGENTS.md                 # rules for any agent (created in PR-1)
├─ CLAUDE.md                 # one line: @AGENTS.md
├─ opencode.json             # OpenCode permissions (soft guardrails)
├─ package.json              # Bun workspaces + root scripts
├─ biome.json
├─ tsconfig.base.json
├─ bunfig.toml               # only if needed
├─ .github/
│  ├─ workflows/ci.yml
│  └─ pull_request_template.md
├─ .opencode/command/        # tiny wrappers -> docs/workflows/*.md
├─ .claude/commands/         # same wrappers for Claude Code
├─ docs/
│  ├─ BOOTSTRAP.md           # this file, moved here after PR-1
│  ├─ architecture.md
│  ├─ STATUS.md              # agent memory: done / next
│  ├─ learnings.md           # proposed learnings (human approves)
│  ├─ ingest-notes.md        # open questions about the resume data
│  ├─ decisions/             # ADR-0001... (short)
│  └─ workflows/             # start-feature.md, open-pr.md
├─ content-source/           # GITIGNORED: resume.pdf, resume.txt
├─ legacy/                   # the old portfolio, moved here in PR-2 (reference only)
├─ packages/
│  └─ content/               # @portfolio/content  (schemas + data + loader)
│     ├─ AGENTS.md
│     ├─ src/ (schemas/, loader.ts, index.ts)
│     ├─ data/en/*.json
│     ├─ data/es/*.json
│     ├─ scripts/extract-resume.ts
│     └─ test/
├─ apps/
│  ├─ web/                   # @portfolio/web  (Astro + Tailwind)
│  │  └─ AGENTS.md
│  └─ api/                   # @portfolio/api  (created as skeleton; chat comes later)
│     └─ AGENTS.md
├─ scripts/check-boundaries.ts
└─ infra/                    # later (AWS IaC)
```

**Dependency rule (enforced by `scripts/check-boundaries.ts`, run in CI):**
- `packages/content` depends on nothing internal.
- `apps/web` may depend on `@portfolio/content` only.
- `apps/api` may depend on `@portfolio/content` only.
- `apps/web` ↔ `apps/api`: **never**. They talk over HTTP in the future.
The script reads each workspace `package.json` and scans import specifiers; it fails on any violation.

**Layers inside `apps/api` (when it grows):** `domain` (pure logic, no I/O) → `application` (use cases, e.g. `answerQuestion`) → `adapters` (http handler, `LLMProvider` implementations, content access). Dependencies point inward only.

**Internal packages are consumed as TypeScript source** (`"exports": "./src/index.ts"`, no build step). The API will be bundled with esbuild at deploy time (later).

**Data flow:**
```
resume.pdf (local, gitignored)
   └─ extract-resume.ts ─▶ resume.txt (local)
         └─ agent structures + human reviews ─▶ packages/content/data/{en,es}/*.json  (committed, sanitized)
                  ├─▶ apps/web  (build time, static JSON imports)
                  ├─▶ apps/api  (later: builds the chat context)
                  └─▶ (optional later) generated PDF
```
Use **static JSON imports** in the loader (not `fs`) so it works in Bun, Vite/Astro and Lambda bundles alike.

---

## 6. Content model (`packages/content`, Zod)

All text fields are plain strings in the locale of the file (`data/en/*`, `data/es/*`). Stable `id`s tie translations together.

- `profile`: `name`, `headline`, `location`, `summary` (string), `links` (`{ label, url }[]`: GitHub, LinkedIn, etc.), optional `email` (only if the human approves publishing it).
- `experience[]`: `id`, `company`, `role`, `startDate` (YYYY-MM), `endDate` (YYYY-MM | null = present), `location?`, `summary`, `highlights: string[]`, `tech: string[]`.
- `skills[]` (groups): `id`, `name`, `items: string[]`.
- `languages[]`: `id`, `name`, `level` (free text, e.g. "Native", "C1").
- `education[]` (optional): `id`, `institution`, `title`, `startDate`, `endDate | null`.
- `now[]` — **the "What I'm working on now" items:**
  - `id`, `kind: 'course' | 'project' | 'learning' | 'other'`
  - `title`, `description`
  - `progress`: integer 0–100
  - `status: 'in-progress' | 'paused' | 'done'`
  - `startedAt?`: ISO date, `updatedAt`: ISO date
  - `links`: `{ label, url }[]` (repo, academy, etc.)
  - `tags: string[]`
  - `now` is **not** in the PDF; it's maintained by hand in `data/{en,es}/now.json`.

**Parity tests (mandatory):** for each collection, `en` and `es` have the same `id`s in the same order, and all non-text fields (dates, urls, progress, status) are identical. Missing/extra keys fail the test.

Loader API (sketch): `getContent(locale: 'en' | 'es'): Content` — validates with Zod at call time and throws a readable error.

---

## 7. Ingest pipeline (PDF → JSON)

Goal: turn the PDF into reviewed, sanitized JSON **once**, so nothing depends on PDF parsing at runtime.

1. The PDF lives at `content-source/resume.pdf`. The folder `content-source/` is **gitignored** (it may contain phone/address; the repo is public).
2. `packages/content/scripts/extract-resume.ts` (run with `bun run ingest:extract`): extracts plain text to `content-source/resume.txt` (use a lightweight lib such as `unpdf`, or fall back to the `pdftotext` CLI if installed; check what works). The script must not print personal data to CI logs.
3. The agent reads `resume.txt` and writes `data/en/*.json` (or `data/es/*.json` if the PDF is Spanish — ask the human). **Do not invent or "improve" facts.** Keep wording faithful; light cleanup only.
4. Anything ambiguous, missing or sensitive → add a bullet to `docs/ingest-notes.md` as a question for the human.
5. Produce the **other language** as a draft translation, clearly marked in the PR description so the human reviews it.
6. The human reviews the JSON diff in the PR. Remove contact data the human doesn't want public.
7. Future: replace the PDF with something better (e.g. direct JSON/YAML maintained by hand). Nothing else changes because everything reads `packages/content`.

If the agent cannot read the PDF in this environment, say so and ask the human to paste the text into `content-source/resume.txt`.

---

## 8. Web specifics (`apps/web`)

- **Astro i18n:** `defaultLocale: 'en'`, `locales: ['en','es']`, `prefixDefaultLocale: false`. Routes: `/` (en), `/es/`. A language switcher in the header keeps the user on the equivalent page.
- **UI strings** (labels, headings, buttons) live in `src/i18n/en.ts` and `src/i18n/es.ts`; type `es` against the shape of `en` so missing keys fail `typecheck`. CV *content* comes from `@portfolio/content`, not from here.
- **Theme tokens:** `src/styles/tokens.css` defines CSS variables (colors, radius, spacing, font) per `:root[data-theme="light"]` and `:root[data-theme="dark"]`. Tailwind maps to these tokens. Default follows `prefers-color-scheme`; the user choice persists in `localStorage` (wrapped in try/catch) and is applied by a tiny inline script before paint to avoid flash.
  Design with a future second axis in mind: `data-style="normal" | "cli"` (do NOT implement the CLI style now; just don't make it hard).
- **Sections:** Hero/Profile, Experience, Skills, Languages, Education (if any), **Now**. Semantic HTML, accessible (landmarks, contrast, keyboard focus), responsive mobile-first, no JS required for content.
- **Now section:** cards with title, description, progress bar (`role="progressbar"` with `aria-valuenow`), status badge, tags, links, and "updated <date>".
- **Look & feel:** inspect `legacy/` for the existing visual identity and reuse it where sensible, but do not copy its code structure blindly.
- Astro runs under Bun for install/scripts. If the Bun runtime misbehaves with Astro, run Astro with Node instead (`bunx astro ...` without `--bun`) and note it in `docs/learnings.md`; don't burn time on it.
- SEO basics: `<title>`, meta description, Open Graph, `hreflang` between en/es, sitemap.

---

## 9. API (`apps/api`) — skeleton only in this iteration

Only if time remains (PR-8): minimal TypeScript app with a web-standard handler `GET /health`, the layer folders, its own `package.json`/`tsconfig`/`AGENTS.md`, and a test. **No chat, no LLM calls yet.**

Future chat requirements (so the structure supports them; don't build now):
- `POST /chat`, streaming response, strict system prompt: answer ONLY from the provided CV context; say "I don't have that information" otherwise; refuse off-topic requests; resist prompt injection.
- `LLMProvider` interface with swappable implementations (free tier).
- Rate limit, max input/output tokens, CORS restricted to the site origin, AWS budget alarm.
- AI evals (10–15 cases): no hallucinated experience, refuses off-topic, resists injection.

---

## 10. Harness files to create in PR-1

Create these exact files (adapt wording if you find an error, but keep the intent).

### `AGENTS.md`
````markdown
# slaveofthecode portfolio v2

Living CV site: profile, experience, skills, languages, "What I'm working on now",
and (later) an AI chat for recruiters. Default language English, plus Spanish.
Talk to the human in Spanish; write code/docs/commits/PRs in English.

## Layout
- packages/content: Zod schemas + CV data (data/en, data/es). SINGLE SOURCE OF TRUTH.
- apps/web: Astro + Tailwind, static output.
- apps/api: Node-compatible TypeScript backend (chat later). Skeleton only for now.
- docs/: architecture, workflows, decisions, STATUS.md (memory), learnings.md
- legacy/: the old portfolio. Reference only. Do not modify. Excluded from lint/CI.

## Commands (Bun, from repo root)
bun install | bun run dev | bun run lint | bun run typecheck | bun test | bun run build
bun run check:boundaries | bun run ingest:extract

## Rules
1. Never invent CV data. Facts come from packages/content. en/es must stay in parity.
2. Theme tokens only (CSS variables). No hard-coded colors.
3. Git: NEVER run git commit/push/merge or gh pr merge. The human commits and pushes.
   Never work on main or v2. Branch from an up-to-date v2 (docs/workflows/start-feature.md).
4. PRs: only after the human pushed, per docs/workflows/open-pr.md (base v2, assignee @me).
5. Done = lint + typecheck + test + build + check:boundaries pass. Report what you could not run.
6. One feature per branch; small diffs; no new dependency without justification.
7. Dependency rule: web and api never import each other; both may import @portfolio/content only.
   No Bun-only APIs in apps/api or packages it uses.
8. Session start: read docs/STATUS.md. Task end: update it.
9. Reusable lessons go to docs/learnings.md as proposals. Do not edit this file yourself.
10. Public repo: never commit the PDF, phone, address or private emails.
````

### `CLAUDE.md`
```
@AGENTS.md
```

### `opencode.json`
```json
{
  "$schema": "https://opencode.ai/config.json",
  "permission": {
    "bash": {
      "*": "ask",
      "git status*": "allow",
      "git diff*": "allow",
      "git log*": "allow",
      "git fetch*": "allow",
      "git pull --ff-only*": "allow",
      "git switch*": "allow",
      "git checkout -b*": "allow",
      "git add*": "allow",
      "git commit*": "deny",
      "git push*": "deny",
      "git merge*": "deny",
      "git reset --hard*": "deny",
      "gh pr create*": "allow",
      "gh pr view*": "allow",
      "gh pr merge*": "deny",
      "bun *": "allow",
      "bunx *": "allow"
    }
  }
}
```
Verify against the installed OpenCode version's docs (key names and rule precedence). The GitHub branch protection is the real safety net regardless.

### `docs/workflows/start-feature.md`
```markdown
1. `git fetch origin && git switch v2 && git pull --ff-only`
2. `git switch -c <type>/<short-name>`  (feat|fix|chore|docs)
3. Tell the human (in Spanish) the branch name and a short plan before coding.
```

### `docs/workflows/open-pr.md`
```markdown
Precondition: the human already committed and pushed the branch.
1. Run lint, typecheck, test, build, check:boundaries. Stop and report if any fails.
2. Read the diff: `git diff origin/v2...HEAD`.
3. `gh pr create --base v2 --assignee @me --title "<conventional title>" --body-file <tmp file following the PR template>`
4. Update docs/STATUS.md. Share the PR URL with the human. Do NOT merge.
```

### Command wrappers (identical content in both folders)
`.opencode/command/start-feature.md` and `.claude/commands/start-feature.md`:
```markdown
Follow docs/workflows/start-feature.md exactly. Feature: $ARGUMENTS
```
`.opencode/command/pr.md` and `.claude/commands/pr.md`:
```markdown
Follow docs/workflows/open-pr.md exactly. Context: $ARGUMENTS
```
(Check the current directory/argument conventions of each tool; adjust if they differ.)

### `.github/pull_request_template.md`
```markdown
## What
## Why
## How to test
## Checklist
- [ ] lint / typecheck / test / build / check:boundaries pass
- [ ] No hard-coded colors; en/es parity kept
- [ ] No personal data (phone, address, private email) added
- [ ] docs/STATUS.md updated
```

### `docs/STATUS.md`
```markdown
## Done
## In progress
## Next steps
## Open decisions
```

### `docs/learnings.md`
```markdown
# Proposed learnings (human approves before they go to AGENTS.md)
```

### `docs/architecture.md` and ADRs
Write `docs/architecture.md` from Section 5 (tree, dependency rule, layers, data flow). Create short ADRs in `docs/decisions/` (context, decision, consequences; ~10 lines each):
- ADR-0001 Same repo with long-lived `v2` branch and cutover PR.
- ADR-0002 Bun as package manager/test runner; Node-compatible code for the API.
- ADR-0003 `packages/content` as single source of truth; PDF is ingest input only.
- ADR-0004 Context stuffing instead of RAG for the chat.
- ADR-0005 Hosting target: S3 + CloudFront, Lambda; Vercel in the meantime.

---

## 11. Roadmap (one PR each; STOP after each for the human)

Rough pacing: Day 1 = PR-1…PR-4, Day 2 = PR-5…PR-6, Day 3 = PR-7 + polish (+ PR-8 if time).

**PR-1 `chore/harness`** — Create everything in Section 10 (except CI, which needs scripts that don't exist yet). Move this file to `docs/BOOTSTRAP.md`.
*Accept:* files exist; `AGENTS.md` matches Section 10. (The human commits, pushes, and opens this very first PR using the command you print, because the PR workflow didn't exist yet.)

**PR-2 `chore/workspace-scaffold`** — Inspect the repo root first. Move the old portfolio into `legacy/` (use `git mv`; keep it buildable only if trivial; exclude it from workspaces, Biome, typecheck and CI). Create Bun workspaces (`apps/*`, `packages/*`), root `package.json` scripts (use `bun run --filter` for workspace fan-out; verify syntax), `tsconfig.base.json`, `biome.json`, `.gitignore` (include `content-source/`), empty workspaces `@portfolio/content`, `@portfolio/web`, `@portfolio/api` each with `package.json`, `tsconfig.json` and a short `AGENTS.md`; `scripts/check-boundaries.ts`; `.github/workflows/ci.yml` (bun install → lint → typecheck → test → build → check:boundaries, on PRs to `v2` and `main`).
*Accept:* `bun install`, `bun run lint`, `bun run typecheck`, `bun test`, `bun run check:boundaries` pass on the empty scaffold; boundary script fails when you temporarily add a forbidden import (prove it, then revert).

**PR-3 `feat/content-schemas`** — Zod schemas (Section 6), `getContent(locale)` loader with static JSON imports, tiny fixture data to exercise tests, parity tests, schema tests (valid and invalid cases).
*Accept:* `bun test` green; invalid data produces a readable error; no `fs` in the loader.

**PR-4 `feat/ingest-resume`** — `extract-resume.ts` + `ingest:extract` script; produce real `data/en/*.json` (or `es`) from the PDF text; draft the other language; fill `docs/ingest-notes.md`.
*Accept:* parity + schema tests pass with real data; no PDF/contact data committed; the human reviews the JSON diff and answers the ingest notes.

**PR-5 `feat/web-base`** — Astro + Tailwind in `apps/web`, i18n routing (`/`, `/es/`), UI string dictionaries, base layout/header/footer, theme tokens with light/dark toggle (no flash), language switcher, SEO basics.
*Accept:* `bun run build` outputs both locales; toggling theme and language works; Lighthouse accessibility ≥ 95 on the home page (report the number); no hard-coded colors.

**PR-6 `feat/web-cv-sections`** — Profile, Experience, Skills, Languages, Education components rendering from `@portfolio/content`.
*Accept:* all sections render in both languages from the JSON; content changes in JSON show up without touching components; responsive on mobile widths.

**PR-7 `feat/now-section`** — `now.json` (en/es) with 2–3 real items agreed with the human, `NowCard` component, section placed on the home page, tests for the schema constraints (progress 0–100, valid status).
*Accept:* updating a `progress` value in JSON changes the UI after rebuild; progress bar is accessible; parity tests pass.

**PR-8 (stretch) `feat/api-skeleton`** — `apps/api` skeleton with layers and `GET /health` + test.
*Accept:* tests pass; no import from `apps/web`; no Bun-only APIs.

After PR-7 (or PR-8), update `docs/STATUS.md` with the next roadmap items (Section 12) and stop.

---

## 12. Out of scope now (future roadmap, in this order)

1. Optional: set up the second Vercel project for `v2` previews (human task).
2. Chat backend (`POST /chat`, `LLMProvider`, free LLM, guardrails) + minimal chat UI as an Astro island.
3. AI evals for the chat.
4. Style axis: "cli" theme and "normal" theme (`data-style`).
5. AWS deployment (S3 + CloudFront, Lambda, budget alarm) with IaC in `infra/`.
6. Replace the PDF as the data origin with something better; optionally generate the PDF from the JSON.
7. Cutover: PR `v2 → main`, remove `legacy/`, fix the original Vercel project settings.

---

## 13. Questions to ask the human at the start (in Spanish, all in one message)

1. Is the PDF at `content-source/resume.pdf`? What language is it in (English/Spanish)?
2. Which contact data may be public (email? LinkedIn? GitHub? phone — default NO)?
3. Should the site keep the visual identity of the current portfolio (see `legacy/`) or do you want a fresh look?
4. Which 2–3 items go in the first "What I'm working on now" list (title, kind, progress, links)?
5. Confirm the human prerequisites in Section 3 are done.

Then update `docs/STATUS.md` and start PR-1.
