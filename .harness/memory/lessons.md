# Lessons

Accumulated working knowledge. The `memory-update` skill appends here after every
completed task. When this file exceeds ~20 lines, fold the durable knowledge into
AGENTS.md (§8.4) and prune.

## 2026-08-30

- Added the cross-agent harness (AGENTS.md + `.harness/` + tool adapters) on branch
  `feat/001-add-ai-harness`. Gotcha: the daily-GIF workflow writes with
  `update-readme.js`, and GIF lists must stay in sync across three files (§5.1).
- opencode commands need a `template` field — `prompt` is rejected by the config
  validator (`opencode debug config`). Validate any `.opencode` change with
  `opencode debug config` before committing.

## 2026-08-31

- Documented the commit-push-PR loop in AGENTS.md (§5.2/§6/§7): the human owns
  commit + `git push`; after the human confirms the push, the agent creates the PR
  (`gh pr create`, base `main`) and assigns it to `slaveofthecode`.
  Gotcha: the agent must NOT commit automatically — always leave changes staged and
  let the human review, commit, and push.
- Gotcha: once a PR is open on a branch, any new commit pushed to that branch lands in
  the same PR. Keep documentation follow-ups on the same branch only if they belong in it.
- SSH gotcha: after restarting the IDE/terminal environment, the ssh-agent can lose the
  loaded key (`ssh-add -l` → "no identities"). Fix: `ssh-add --apple-use-keychain
  ~/.ssh/id_ed25519`; if `ssh -T` still fails, re-add the public key to GitHub.

## 2026-10-14

- Retired `master`; the default branch is now `main`. `main` was **521 commits behind**
  `master`, so it was synced via a `master → main` PR (PR #4 — merge, no content change).
  Gotcha: a direct fast-forward `git push origin main` is rejected (`GH013`) — the
  `rs-validation-pr` **ruleset** requires changes on the default branch to go through a
  PR. Rulesets are not classic branch protection, so `branches/<name>/protection` 404s
  ("Branch not protected") while pushes are still blocked.
- Updated `master` → `main` across the harness: `AGENTS.md` (§5.2/§6/§7),
  `.cursor/rules/000-harness.mdc`, `.opencode/opencode.json` (deny rules),
  `.harness/agents/*`, and memory.