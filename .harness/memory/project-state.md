# Project state

Truthful snapshot of where the project stands. Keep updated after every task
(`memory-update` skill).

- **Current branch:** `docs/002-base-branch-main`
- **In-flight work:** retiring `master` in favour of `main`. Done: `main` was synced
  from `master` via **PR #4** (merged), remote `master` deleted, and all `master`
  references updated to `main` across the harness (AGENTS.md §5.2/§6/§7, `.cursor`,
  `.opencode/opencode.json`, `.harness/agents/*`, memory). This branch stages the
  doc/memory changes; the human commits+pushes and the agent opens the PR to `main`.
  No app-code changes to `src/`.
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
