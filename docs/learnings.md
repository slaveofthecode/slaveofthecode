# Proposed learnings (human approves before they go to AGENTS.md)

Durable lessons proposed by the agent. The human reviews them and promotes the
good ones into `AGENTS.md`. Do not edit `AGENTS.md` directly.

- Git gotchas carried over from v1: direct pushes to protected branches are rejected
  (`GH013`); use feature branches + PRs. `gh` is authenticated and SSH works.
- opencode custom commands declared inline need a `template` field (a `prompt` field
  is rejected). Markdown command files under `.opencode/command/` use the body as the
  template, with `$ARGUMENTS` for user input.
