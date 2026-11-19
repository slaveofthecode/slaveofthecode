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
├─ .vscode/                   # Cursor/VS Code: Biome owns save formatting
├─ tsconfig.base.json
├─ .github/workflows/ci.yml
├─ .opencode/command/        # tiny wrappers -> docs/workflows/*.md
├─ .claude/commands/         # same wrappers for Claude Code
├─ docs/
│  ├─ BOOTSTRAP.md           # historical reference
│  ├─ architecture.md
│  ├─ STATUS.md              # agent memory: done / next
│  ├─ learnings.md           # proposed learnings (human approves)
│  ├─ decisions/             # ADR-0001...
│  └─ workflows/             # start-feature.md, open-pr.md
├─ content-source/           # GITIGNORED: raw CV working copy (not used by the build)
├─ vercel.json               # builds apps/web from the repo root
├─ packages/content/         # @portfolio/content (schemas + data + loader)
├─ apps/web/                 # @portfolio/web (Astro + Tailwind)
├─ apps/api/                 # @portfolio/api (chat backend; second Vercel project)
├─ scripts/check-boundaries.ts
└─ infra/                    # later (AWS IaC)
```

## Editor formatting (Cursor / VS Code)

`.vscode/settings.json` disables format-on-save globally and enables it only for
languages Biome supports (JS, JSX, TS, TSX, JSON, JSONC, CSS), using the
`biomejs.biome` extension and the root `biome.json`. Save also applies Biome's safe
fixes and import sorting. Other file types are left untouched, so a save never
introduces formatting that `bun run lint` will reject. Install the recommended
extension from Open VSX in Cursor.

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
runs the cost guards (see below), embeds the last user message, retrieves the top-k CV
chunks from the SQLite snapshot (cosine), grounds the model on those excerpts via the
system prompt, and calls an `LlmProvider` (Gemini via `fetch`, or a fake in tests).
No session is kept; the browser sends the last N turns. The site and the chat are
English-only (ADR-0007): the request has no `locale` field and chunks have no locale.

**Profile grounding guarantee:** identity/contact questions ("what is your email?",
"how can I contact you?") embed poorly against the long CV chunks and often miss the
top-k window, so the `profile` chunk is always prepended to the context (via
`RagStore.getChunk`), independent of the vector ranking. It is the smallest chunk and
carries name, location, email, phone and links.

## Chat cost caps

Every check runs **before** any Gemini call, so a blocked request costs `0`:

1. `Content-Length` > 16 KB → `413 payload_too_large`.
2. Body fails `chatRequestSchema` (max 12 messages, 2000 chars each) → `400 invalid_request`.
3. Origin present but not in `ALLOWED_ORIGINS` → `403 forbidden_origin`.
4. Per-IP window: `RATE_LIMIT_MAX` (default **10**) per `RATE_LIMIT_WINDOW_SECONDS`
   (default **60**) → `429 rate_limited` + `Retry-After`.
5. Global ceiling: `RATE_LIMIT_DAILY_MAX` (default **200**) per **UTC day**, shared by
   all callers (checked after the per-IP guard, so one abusive IP cannot burn the daily
   budget of everyone else) → `429 daily_limit_reached` + `Retry-After`.
6. Generate: `maxOutputTokens` hard-clamped to **800**, `thinkingBudget: 0`.

The counters live in process memory (`adapters/rate-limit/*`): on Vercel each
instance/cold start has its own, so this is a **best-effort** cap, not a distributed
one. The **hard spend ceiling is the Google Cloud budget** on the `GEMINI_API_KEY`
project (pay-as-you-go, USD 5 limit + alerts). Optional second layers, configured by
the human in dashboards (no code): a Vercel WAF rate-limit rule on `/api/chat`, and
Cloudflare Turnstile in front of the chat form.

Ingestion (`bun run build:rag`, `apps/api/scripts/build-rag.ts`): `@portfolio/content`
(the single `cv.json`, including `now` and personal projects) → `buildChunks` → Gemini embeddings →
`buildRagBytes` (SQLite) → commits `apps/api/data/cv.sqlite` + the runtime module
`apps/api/src/data/rag-db.ts`.

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
  source. The values it needs are generated into the repo (`data/rag-db.ts` and
  `data/sql-wasm.ts`), so there is no runtime package or file resolution.

## Deployment

Two Vercel projects from the same repo (ADR-0006):

- **web** — root directory `/`; root `vercel.json` builds `apps/web` (static). Env:
  `PUBLIC_API_URL` = the API project URL.
- **api** — root directory `apps/api`; `apps/api/vercel.json` builds the functions
  (`api/chat.ts`, `api/health.ts`), rewrites `/chat` and `/health` to them, and embeds the
  sql.js WASM. Env: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_EMBED_MODEL`,
  `ALLOWED_ORIGINS`, `RATE_LIMIT_MAX`, `RATE_LIMIT_WINDOW_SECONDS`,
  `RATE_LIMIT_DAILY_MAX` (the `RATE_*` vars are optional overrides of the cost-cap
  defaults).

The SQLite snapshot is committed and read-only at runtime; it is not persistent storage.
Re-run `bun run build:rag` (with `GEMINI_API_KEY`) after changing the CV.

## Data flow

```
packages/content/data/cv.json  (committed, hand-maintained; single source of truth)
   ├─▶ apps/web  (build time, static JSON imports → static HTML)
   ├─▶ apps/web/scripts/generate-cv-pdfs.ts  (build time → public/cv.pdf + cv-ats.pdf)
   └─▶ apps/api  (build:rag → embeddings → SQLite snapshot; per request: retrieval + chat)
```

Use static JSON imports in the loader (not `fs`) so it works in Bun, Vite/Astro and
Lambda bundles alike. `content-source/` stays gitignored as a personal working copy;
it is never read by the build.

## Downloadable CVs

`apps/web/package.json` runs `bun scripts/generate-cv-pdfs.ts` before `astro build`.
The script calls `renderCvPdf(getContent(), mode)` in `src/lib/cv-pdf.ts`: `designed`
(adds a dark header, section rules and accent labels) and `ats` (plain black Helvetica,
linear sections with `-` bullets). Both are A4, use theme-independent colors, and are
linked from the hero as `/cv.pdf` and `/cv-ats.pdf`. Download filenames come from
`resumeFilename(name, variant)`.
