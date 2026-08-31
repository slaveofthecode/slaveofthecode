# Claude Code — harness adapter

This repository uses a cross-agent harness. The single source of truth is
`AGENTS.md` at the repo root. Read and strictly follow it.

@AGENTS.md

## Where the harness lives

- `.harness/memory/` — persistent cross-agent memory: `lessons.md`,
  `decisions.md`, `project-state.md` (self-learning protocol lives in the
  `memory-update` skill).
- `.harness/skills/<name>/SKILL.md` — reusable procedures (see the index in AGENTS.md §9).
- `.harness/agents/<name>.md` — sub-agent definitions; the stubs in `.claude/agents/`
  only forward to them.

## What differs from AGENTS.md

Nothing substantive. AGENTS.md is canonical; this file exists only so Claude Code
loads the same rules everyone else reads natively. If a conflict appears, AGENTS.md wins.

## Claude Code specifics

- Sub-agent stubs in `.claude/agents/` forward to `.harness/agents/` — follow the
  full definition there.
- Hard Rules (branch policy, permissions, memory protocol) are in AGENTS.md §6-§8 —
  enforce them as instructions (Claude Code has no permission engine like opencode).