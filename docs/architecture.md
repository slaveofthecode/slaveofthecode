# Architecture

Living CV website. The new site lives on `main` (cutover complete); see
`docs/decisions/` for the ADRs behind each choice.

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
├─ vercel.json               # builds apps/web from the repo root
├─ packages/content/         # @portfolio/content (schemas + data + loader)
├─ apps/web/                 # @portfolio/web (Astro + Tailwind)
├─ apps/api/                 # @portfolio/api (chat backend; second Vercel project)
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

`domain` (pure logic, no I/O: `chat`, `rag` chunking + cosine, `system-prompt`,
`llm-provider`, `embedding-provider`, `health`) → `application` (use cases:
`answerQuestion`, `getHealth`) → `adapters` (`http/router` web-standard handler,
`llm/*` Gemini providers, `rag/sqlite-store` (sql.js), `rate-limit/*`, `config`).
Dependencies point inward only.

The chat (`POST /chat`, ADR-0006) is RAG: the handler validates the request (`zod`),
rate-limits per IP (in-memory), embeds the last user message, retrieves the top-k CV
chunks from the SQLite snapshot (cosine), grounds the model on those excerpts via the
system prompt, and calls an `LlmProvider` (Gemini via `fetch`, or a fake in tests).
No session is kept; the browser sends the last N turns.

Ingestion (`bun run build:rag`, `apps/api/scripts/build-rag.ts`): `@portfolio/content`
(every locale, including `now`) → `buildChunks` → Gemini embeddings → `buildRagBytes`
(SQLite) → commits `apps/api/data/cv.sqlite` + the runtime module `apps/api/src/data/rag-db.ts`.

Internal packages are consumed as TypeScript source (`"exports": "./src/index.ts"`,
no build step). `apps/api` runs on Vercel's Node runtime via Web Standard
`export default { fetch }` entries (`apps/api/api/{chat,health}.ts`); `vercel.json`
rewrites the clean `/chat` and `/health` paths to them and the router strips the
Vercel `/api` prefix. AWS Lambda stays the long-term target.

Vercel does **not** bundle `apps/api`: it transpiles each `.ts` to `.js` and runs them
under Node ESM. Two consequences in `apps/api/api` and `apps/api/src`, both load-bearing:
- Every relative import must use an explicit `.js` extension (Node ESM has no extensionless
  resolution; the TS source imports `./x.js` and the compiler/tracer map it to `./x.ts`).
- The runtime must not import a workspace TypeScript package (e.g. `@portfolio/content`):
  Vercel leaves bare specifiers **external** and Node cannot execute the package's `.ts`
  source. Values it needs are kept local (see `CHAT_LOCALES` in
  `apps/api/src/domain/chat.ts`, parity-guarded by a test). The sql.js WASM is embedded as
  base64 for the same reason (no runtime file resolution).

## Deployment

Two Vercel projects from the same repo (ADR-0006):

- **web** — root directory `/`; root `vercel.json` builds `apps/web` (static). Env:
  `PUBLIC_API_URL` = the API project URL.
- **api** — root directory `apps/api`; `apps/api/vercel.json` builds the functions
  (`api/chat.ts`, `api/health.ts`), rewrites `/chat` and `/health` to them, and embeds the
  sql.js WASM. Env: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBED_MODEL`,
  `ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`.

The SQLite snapshot is committed and read-only at runtime; it is not persistent storage.
Re-run `bun run build:rag` (with `GEMINI_API_KEY`) after changing the CV.

## Data flow

```
resume.pdf (local, gitignored)
   └─ extract-resume.ts ─▶ resume.txt (local)
         └─ ingest ─▶ packages/content/data/{en,es}/*.json  (committed, sanitized; source of truth)
                  ├─▶ apps/web  (build time, static JSON imports)
                  ├─▶ apps/api  (build:rag → embeddings → SQLite snapshot; per request: retrieval + chat)
                  └─▶ (optional later) generated PDF
```

Use static JSON imports in the loader (not `fs`) so it works in Bun, Vite/Astro and
Lambda bundles alike.
