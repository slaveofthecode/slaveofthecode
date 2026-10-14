# Project state

Truthful snapshot of where the project stands. Keep updated after every task
(`memory-update` skill).

- **Current branch:** `docs/001-add-pr-flow`
- **In-flight work:** harness landed via **PR #2** (merged). Documenting the
  commit-push-PR flow in AGENTS.md §5.2/§6/§7 (the human owns commit + push; the agent
  creates the PR after). No app-code changes to `src/`.
- **Environment:** SSH auth fixed (key loaded in ssh-agent + macOS Keychain + re-added
  the public key to GitHub).
- **Known issues:**
  - `.github/workflows/update-readme.yml` calls `node update-readme.ts`, but the
    actual file is `update-readme.js` (the workflow is broken in CI for this step).
  - The workflow also runs `npm install` and sets `node-version: '16'`; the script
    only needs Node built-ins — both are overkill/fragile.
- **Next reasonable task:** commit + push this branch, then agent creates the PR;
  optionally fix the CI workflow (needs a new `fix/001-...` branch).