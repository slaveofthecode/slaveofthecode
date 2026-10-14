# Architecture

Living CV website. Same repo, long-lived `v2` branch, cutover to `main` at the end.
See `docs/decisions/` for the ADRs behind each choice.

## Layout

```
/
├─ AGENTS.md                 # rules for any agent
├─ CLAUDE.md                 # one line: @AGENTS.md
├─ opencode.json             # OpenCode permissions (soft guardrails)
├─ package.json              # Bun workspaces + root scripts
├─ biome.json
├─ tsconfig.base.json
├─ .github/workflows/ci.yml
├─ .opencode/command/        # tiny wrappers -> docs/workflows/*.md
├─ .claude/commands/         # same wrappers for Claude Code
├─ docs/
│  ├─ BOOTSTRAP.md           # historical reference
│  ├─ architecture.md
│  ├─ STATUS.md              # agent memory: done / next
│  ├─ learnings.md           # proposed learnings (human approves)
│  ├─ ingest-notes.md        # open questions about the resume data
│  ├─ decisions/             # ADR-0001...
│  └─ workflows/             # start-feature.md, open-pr.md
├─ content-source/           # GITIGNORED: resume.pdf, resume.txt
├─ legacy/                   # the old portfolio, reference only
├─ packages/content/         # @portfolio/content (schemas + data + loader)
├─ apps/web/                 # @portfolio/web (Astro + Tailwind)
├─ apps/api/                 # @portfolio/api (skeleton; chat later)
├─ scripts/check-boundaries.ts
└─ infra/                    # later (AWS IaC)
```

## Dependency rule (enforced by `scripts/check-boundaries.ts`, run in CI)

- `packages/content` depends on nothing internal.
- `apps/web` may depend on `@portfolio/content` only.
- `apps/api` may depend on `@portfolio/content` only.
- `apps/web` ↔ `apps/api`: never. They talk over HTTP in the future.

The script reads each workspace `package.json` and scans import specifiers; it fails
on any violation.

## Layers inside `apps/api`

`domain` (pure logic, no I/O) → `application` (use cases, e.g. `answerQuestion`) →
`adapters` (http handler, `LLMProvider` implementations, content access).
Dependencies point inward only.

Internal packages are consumed as TypeScript source (`"exports": "./src/index.ts"`,
no build step). The API is bundled with esbuild at deploy time (later).

## Data flow

```
resume.pdf (local, gitignored)
   └─ extract-resume.ts ─▶ resume.txt (local)
         └─ agent structures + human reviews ─▶ packages/content/data/{en,es}/*.json  (committed, sanitized)
                  ├─▶ apps/web  (build time, static JSON imports)
                  ├─▶ apps/api  (later: builds the chat context)
                  └─▶ (optional later) generated PDF
```

Use static JSON imports in the loader (not `fs`) so it works in Bun, Vite/Astro and
Lambda bundles alike.
