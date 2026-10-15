# @portfolio/content

Zod schemas + CV data (`data/en`, `data/es`) and the loader. Single source of truth
for every CV fact. Depends on no other internal package.

- `src/` — `schemas/`, `loader.ts`, `index.ts`.
- `data/{en,es}/*.json` — committed, sanitized.
- `scripts/extract-resume.ts` — PDF → text ingest (PR-4).
- `test/` — schema + en/es parity tests.

Run: `bun run typecheck`, `bun test`. Rules live in the root `AGENTS.md`.
