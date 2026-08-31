# AGENTS.md — Slave of the Code (Gustavo Lopez)

Canonical context and rules for **any AI coding agent** working on this repository.
Read this file in full before doing anything. Every other harness file in `.harness/`
is consumed relative to this one. This file is the **single source of truth**;
tool-specific adapters (`.opencode/`, `.claude/`, `.cursor/`) only forward to it.

If this file conflicts with a tool's own config or another instruction file,
**AGENTS.md wins**.

---

## 1. What this repository is

This is a **triple-purpose personal repo** for Gustavo "slaveofthecode" Lopez:

1. **Portfolio website** — an [Astro](https://astro.build) 4 static site deployed to
   https://slaveofthecode.vercel.app/. All CV content is data-driven.
2. **GitHub profile README** — `README.md` renders on
   https://github.com/slaveofthecode and is automatically rewritten with a daily random GIF.
3. **Special GitHub repo** — `slaveofthecode/slaveofthecode`.

Do not confuse the two faces: the **website** is built from `src/`, the **profile README**
is plain Markdown served by GitHub. Changes to one rarely affect the other.

---

## 2. Commands

Run these from the repository root. Do not invent other scripts.

| Command | Action |
|---|---|
| `npm run dev` | Start the Astro dev server (also aliased `npm start`) |
| `npm run build` | Type-check then build: runs `astro check` then `astro build` |
| `npm run preview` | Preview the production build locally |
| `npx astro check` | Type-check only (fast feedback loop) |
| `node update-readme.js` | Rewrite `README.md` with a random GIF (used by CI) |

Verification before finishing ANY change: `npm run build` (see the `verify-build` skill).

---

## 3. Architecture map

```
├── astro.config.mjs            # Astro config; only integration is Tailwind
├── tailwind.config.mjs         # Tailwind 3 config
├── tsconfig.json               # path aliases: @/* → src/*, @cv/* → src/data/*
├── update-readme.js            # CI script: swaps the README random GIF
├── README.md                   # GitHub PROFILE README (not the site)
└── src/
    ├── pages/
    │   ├── index.astro         # single page, assembles all sections
    │   └── api/random-gif.ts   # API route → 302 redirect to a random GIF
    ├── components/
    │   ├── MainDataMinimalist.astro
    │   ├── MultilanguageSelect.astro  # currently fully commented-out
    │   ├── DarkWhite.astro            # dark/white theme toggle
    │   ├── InProgress.astro           # work-in-progress badge
    │   ├── KeyboardManager.astro      # hotkeypad command palette (Cmd/Ctrl+K)
    │   └── sections/                  # one component per CV section
    │       ├── Header.astro     AboutMe.astro  Experience.astro
    │       ├── Educations.astro  Skills.astro  Projects.astro
    │       └── Certifications.astro
    ├── layouts/Layout.astro    # <html>, OG tags, fonts, schema.org JSON-LD
    ├── data/resume.json        # THE cv data model (see §4)
    ├── icons/                  # inline SVG icon components
    ├── styles/reset.css
    ├── utils/index.ts          # getJsonCV() → typed import of resume.json
    └── types.d.ts
```

Key details:

- **Data source**: every section imports its data from `src/data/resume.json` via
  `getJsonCV()` (`src/utils/index.ts`) or `import { basics } from "@/data/resume.json"`.
  `@/` → `src/`, `@cv/` → `src/data/`.
- **API route**: `src/pages/api/random-gif.ts` redirects (`302`) to a random Giphy URL
  with `Content-Disposition: inline` so GitHub renders it as an image.
- **i18n**: a multilingual select component exists but is **commented out**; the site is
  effectively English-only (some UI copy is Spanish; preserve the existing mix).
- **Theme**: `DarkWhite.astro` toggles `dark:` Tailwind classes on `<html>`.

---

## 4. Data model — `src/data/resume.json`

All CV content lives here. When adding content, update this file (see the
`add-resume-entry` skill for the exact recipe). Current top-level keys:

| Key | Shape (one entry) |
|---|---|
| `basics` | `{ name, title, label, email, phone, url, summary, location, profiles[] }` |
| `experience[]` | `{ rol, company, mode:{time,type}, date:{start,end}, summary, stack[], url }` |
| `education[]` | `{ institution:{abbreviation,name,url}, area, studyType, date:{start,end} }` |
| `skills[]` | `{ name }` |
| `projects[]` | `{ name, url:{Github,Demo?}, isActive?, description, highlights[] }` |
| `certificates[]` | `{ name, date, issuedBy, url }` |
| `volunteer[]`, `awards[]`, `publications[]`, `languages[]`, `interests[]`, `references[]` | reserved (present, some not rendered) |

Rendering expects these keys verbatim (e.g. `Projects.astro` reads `url.Demo` and
`url.Github`; `isActive` is unused by the renderer today). **Do not rename keys**
without updating the renderer.

When adding a `projects[]` entry, the icon map in `Projects.astro`
(`ICONS_PROFILES`) supports the url keys `Github` and `Demo`.

---

## 5. Workflows

### 5.1 Daily random-GIF README (GitHub Actions)
- Trigger: cron daily + manual. See `.github/workflows/update-readme.yml`.
- Steps: `npm install` → `node update-readme.js` → commit & push if changed.
- `update-readme.js` reads `README.md`, replaces the `![Random GIF](...)` line with a
  randomly picked GIF from its local `gifs` array.
- GIF URL lists exist in **three places** that must stay in sync:
  1. `update-readme.js` (the CI writer)
  2. `src/pages/api/random-gif.ts` (the live site endpoint)
  3. the static fallback in `README.md` (renders between CI runs)

### 5.2 Feature/bug-fix loop (any agent)
1. Read this file + `.harness/memory/project-state.md`.
2. Load the relevant skill from `.harness/skills/` (see index below).
3. Create/completask on a feature branch (see §6), never on `master`.
4. Make the change, run `npm run build`, update memory per §8, then commit.

---

## 6. Git & branching policy (HARD RULES)

- **Never commit, push, or PR directly on `master`.** Request a branch instead.
- Branch naming convention: `type/###-short-kebab-slug`
  - `type` ∈ `feat`, `fix`, `chore`, `docs`, `refactor`, `test`
  - `###` = zero-padded ordinal per type (next counter for the type)
  - Examples: `feat/001-add-new-login-button`, `fix/002-fix-mobile-nav`, `chore/003-update-deps`
- Before starting a task, determine the next ordinal by listing existing branches:
  `git branch -a | grep "^..*<type>/"` and take max+1.
- Commit style: imperative, concise, prefixed with the conventional type,
  e.g. `feat: add dark mode toggle`. Never push commits that fail to build.
- Never stage or commit secrets, `node_modules/`, `dist/`, `.astro/`, or `.qodo/`.
- If a change is generated-consistent (e.g. `astro check` output), regenerate, don't hand-edit.

---

## 7. Permissions & hard rules

These rules apply to **every agent, in every tool**. The tool-specific adapters
mirror them natively where the tool can enforce (opencode's permission engine),
otherwise as instructions.

**Always allowed**
- Reading any project file, `git status/diff/log/branch`.
- Running `npm run dev/build/preview`, `npx astro check`, `node update-readme.js`.
- Editing files under `src/`, `config`, `README.md`, `package.json`, `AGENTS.md`.
- Creating branches, staging files, `git push` to a **feature** branch.

**Require human confirmation**
- Any `git commit`, `git push`, `git merge`, `git reset --hard`, `git force`.
- `npm install`/`npm uninstall` (dependency changes), any script not listed above.
- Editing files under `.harness/memory/` — do it only via the `memory-update` protocol (§8).

**Never (without explicit request)**
- Checkout/switch to `master` or run destructive git ops.
- Edit `dist/`, `.astro/`, `node_modules/`, `.qodo/`.
- Replace the GIF list in only ONE of the three places (see §5.1 — all three stay in sync).
- Leave commented-out code in new work (existing commented blobs in this repo are intentional).

---

## 8. Memory & self-learning protocol (HARD)

The harness learns. After **every completed task**, follow the `memory-update` skill:

1. **Lessons** → append 1-3 concise bullets to `.harness/memory/lessons.md`
   (`what changed`, `where`, and any `gotcha`).
2. **Decisions** → if a meaningful architectural choice was made, log it in
   `.harness/memory/decisions.md` (format: date · decision · rationale · alternatives).
3. **State** → keep `.harness/memory/project-state.md` truthful: current branch,
   in-flight work, known issues.
4. **Consolidation** → when `lessons.md` grows (~20+ lines) or structure changes,
   fold the durable knowledge back into this file and prune the memory log. Do this
   in the same commit as the substantative change whenever reasonable.

Memory files are plain Markdown so every tool can follow the same loop.

---

## 9. Skills index (`.harness/skills/`)

Load the relevant `SKILL.md` when the task matches. Read the file, follow it in full.

| Skill | When to use |
|---|---|
| `add-resume-entry` | Adding/editing CV content in `src/data/resume.json` (projects, experience, skills…) |
| `update-readme-gif` | Touching the daily GIF automation or GIF URL lists |
| `verify-build` | Before finishing ANY change — required verification |
| `memory-update` | After finishing any task — required self-learning step |

## 10. Sub-agent index (`.harness/agents/`)

Full definitions live in `.harness/agents/`. Tool adapters only forward to them.

| Agent | Focus |
|---|---|
| `feature-builder` | Implement features/fixes in the Astro site |
| `data-curator` | Maintain `resume.json` safely and schema-true |
| `readme-maintainer` | Own `README.md` + the daily GIF workflow |
| `site-reviewer` | Independent review; autoridade on build/type correctness |

---

## 11. Do / Don't summary

- Do: read `.harness/memory/project-state.md` first; run `npm run build` before finishing.
- Don't: commit to `master`; duplicate GIF lists; invent new scripts; edit memory without protocol.
- When unsure, prefer asking the human over guessing.