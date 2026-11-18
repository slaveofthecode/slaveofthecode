# @portfolio/content

Zod schemas + the single hand-maintained `data/cv.json` and the loader. Single
source of truth for every CV fact. Depends on no other internal package.

- `src/` — `schemas/`, `loader.ts`, `index.ts`.
- `data/cv.json` — committed, hand-maintained.
- `test/` — schema + loader tests.

Run: `bun run typecheck`, `bun test`. Rules live in the root `AGENTS.md`.
