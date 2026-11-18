# ADR-0007 Manual JSON CV source, English-only site, generated PDFs

- **Context:** the PDF→JSON ingest and the en/es draft translation added a second
  workflow and parity burden without improving the published site. The public site
  is English-only, and the downloadable CV must always match the data shown on it.
- **Decision:**
  - `packages/content/data/cv.json` is the single source of truth, maintained by hand
    and validated with Zod via `parseContent`/`getContent`.
  - The web serves only `/` with static English UI strings in `apps/web/src/lib/strings.ts`.
    `astro.config.mjs` has no `i18n`, `/es/` and `LanguageSwitcher` are removed, and
    `vercel.json` redirects `/es` to `/`.
  - `apps/web/scripts/generate-cv-pdfs.ts` runs before `astro build` and writes both
    `apps/web/public/cv.pdf` and `apps/web/public/cv-ats.pdf` from the same JSON using
    `pdf-lib` (pure TypeScript, no native binaries). The hero links to both.
  - The chat has no `locale` input: `POST /chat` accepts `{ messages }`, RAG chunks
    have unprefixed ids and no locale column, and the system prompt always answers in
    English. The SQLite snapshot is regenerated from the EN data only.
- **Consequences:** one edit updates the web, both PDFs and the chat; no ingest step,
  no translation drift, no committed source PDF. The generated PDFs are build outputs
  committed as public artifacts. Changing the CV requires `bun run build` (web/PDFs)
  and `bun run --filter @portfolio/api build:rag` (chat snapshot, needs `GEMINI_API_KEY`).
