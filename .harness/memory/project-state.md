# Project state

Truthful snapshot of where the project stands. Keep updated after every task
(`memory-update` skill).

- **Current branch:** `feat/001-add-ai-harness`
- **In-flight work:** harness implemented and committed; config validated via
  `opencode debug config`. Pending: restart opencode so the harness loads; smoke-test
  in Claude Code and Cursor. No app-code changes to `src/`.
- **Known issues:**
  - `.github/workflows/update-readme.yml` calls `node update-readme.ts`, but the
    actual file is `update-readme.js` (the workflow is broken in CI for this step).
  - The workflow also runs `npm install` and sets `node-version: '16'`; the script
    only needs Node built-ins — both are overkill/fragile.
- **Next reasonable task:** implement the harness; optionally fix the CI workflow.