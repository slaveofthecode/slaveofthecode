# Project state

Truthful snapshot of where the project stands. Keep updated after every task
(`memory-update` skill).

- **Current branch:** `feat/001-add-ai-harness`
- **In-flight work:** adding the cross-agent AI harness (AGENTS.md, `.harness/`,
  `.opencode/`, `.claude/`, `.cursor/`). No app-code changes to `src/`.
- **Known issues:**
  - `.github/workflows/update-readme.yml` calls `node update-readme.ts`, but the
    actual file is `update-readme.js` (the workflow is broken in CI for this step).
  - The workflow also runs `npm install` and sets `node-version: '16'`; the script
    only needs Node built-ins — both are overkill/fragile.
- **Next reasonable task:** implement the harness; optionally fix the CI workflow.