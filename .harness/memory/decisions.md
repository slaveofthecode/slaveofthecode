# Decisions

Architectural/logical choices. Format: `date · decision · rationale · alternatives`.

## 2026-08-30 · Single-source harness via AGENTS.md
The harness is canonical in `AGENTS.md` + plain Markdown in `.harness/`; tool
adapters (`.opencode/`, `.claude/`, `.cursor/`) are thin forwarding stubs.
Rationale: AGENTS.md is the cross-vendor agent instruction standard, so the same
rules load in opencode, Claude Code, Cursor, Copilot, etc. without duplicating
policy (no drift). Alternatives: parallel full per-tool configs (rejected — drifts).