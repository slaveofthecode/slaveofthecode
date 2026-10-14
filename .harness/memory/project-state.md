# Project state

Truthful snapshot of where the project stands. Keep updated after every task
(`memory-update` skill).

- **Current branch:** `docs/003-project-analysis`
- **In-flight work:** added `docs/project-analysis.md` — human-facing overview of the
  stack, folder structure (ASCII map), AI-harness flow, and a prioritized improvement
  backlog (P0: fix daily-GIF workflow + add PR build CI + clean orphan components;
  P1: Astro 4.3.6 → 7.x stepwise; P2: Tailwind 4, resume.json schema validation, lint).
  Consolidated `lessons.md` into AGENTS.md §6 (git gotchas). Build green.
  The human commits+pushes; the agent opens the PR to `main`.
- **Previous:** PR #5 (`docs/002-base-branch-main`) retired `master` → `main`.
- **Environment:** SSH auth OK. Default branch is **`main`**; governed by ruleset
  **`rs-validation-pr`** (`~DEFAULT_BRANCH`: requires PRs, `non_fast_forward`,
  `deletion`, `copilot_code_review`). Direct pushes to `main` are rejected (`GH013`).
- **Known issues:**
  - `.github/workflows/update-readme.yml` pushes directly to the default branch
    (`git push`), but `main` requires PRs — the daily GIF commit may be rejected unless
    the ruleset grants an Actions/`GITHUB_TOKEN` bypass. Verify after the next run.
  - The workflow still runs `npm install` and pins `node-version: '16'` unnecessarily
    (the script uses only Node built-ins).
- **Next reasonable task:** commit + push this branch, then open the PR to `main`;
  optionally add a ruleset bypass (or PR mode) for the GIF workflow, and clean up merged
  branches (`docs/001-add-pr-flow`, `feat/001-add-ai-harness`,
  `feat/fixes-by-metaexplorer-extension`).
