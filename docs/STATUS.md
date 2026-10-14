# STATUS

Agent memory. Read at the start of every session; update at the end of every task.

## Done
- PR-1 (`chore/harness`): v2 harness created — `AGENTS.md`, `CLAUDE.md`, root
  `opencode.json`, `docs/workflows/{start-feature,open-pr}.md`, `.opencode/command/`
  and `.claude/commands/` wrappers, `.github/pull_request_template.md`,
  `docs/{STATUS,learnings,architecture}.md`, `docs/decisions/ADR-0001..0005`.
- `BOOTSTRAP.md` moved to `docs/BOOTSTRAP.md`.
- Privacy fix: `content-source/` is now gitignored and `resume.pdf` removed from git.

## In progress
- Nothing. Waiting for the human to reset `v2` to `origin/v2`, commit and push
  `chore/harness`, then open PR-1 (base `v2`).

## Next steps
- PR-2 `chore/workspace-scaffold`: move old portfolio to `legacy/`, Bun workspaces,
  root scripts, Biome, tsconfig base, empty `@portfolio/{content,web,api}`,
  `scripts/check-boundaries.ts`, CI. Clean up the leftover v1 harness (`.harness/`,
  `.claude/agents/`, `.opencode/agent/`, `update-readme.js`, old `src/`, `public/`).
- PR-3 `feat/content-schemas`.
- PR-4 `feat/ingest-resume`.
- PR-5..PR-7 web (base, CV sections, Now).
- PR-8 (stretch) `feat/api-skeleton`.

## Open decisions
- Resume source is in English → `data/en/*.json` is the source language, `data/es/*`
  is a draft translation (confirm at PR-4).
- The human asked that the public site show the same contact info as the PDF. Confirm
  at PR-4 which fields (email/LinkedIn/GitHub) are safe to publish; phone/address stay
  out by default (public repo).
- Visual direction: keep the current identity as a base but with a refreshed look.
- "Now" items: first iteration uses clearly-marked mock data (replace later with real ones).
