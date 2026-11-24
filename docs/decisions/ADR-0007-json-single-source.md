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
  - `apps/web/src/lib/download-cv.ts` renders both PDFs in the browser on download click
    from the same JSON using `pdf-lib` (pure TypeScript, no native binaries). The header
    buttons request `designed` or `ats`; each generated `Blob` is cached per variant and
    reused on later clicks. This supersedes the earlier build-time/committed-PDF flow.
  - The chat has no `locale` input: `POST /chat` accepts `{ messages }`, RAG chunks
    have unprefixed ids and no locale column, and the system prompt always answers in
    English. The SQLite snapshot is regenerated from the EN data only.
  - `cv.json` also owns `profile.avatar` (a public root-relative path, used by the web and
    fetched in the browser for the designed PDF) and `personalProjects[]` (name, short description,
    tech, repo URL, production URL and thumbnail URL). The web shows personal projects
    after "What I'm working on now"; both PDFs show a reduced project block.
- **Consequences:** one edit updates the web and both PDFs immediately; the chat catches
  up when `sync-rag.yml` regenerates its snapshot in the same PR for same-repo `cv.json` edits,
  with a post-merge review PR as fallback. No ingest step, no translation drift, no committed PDF
  artifacts. Changing the CV still requires a web build and
  `bun run --filter @portfolio/api build:rag` locally (chat snapshot, needs `GEMINI_API_KEY`);
  PDFs always reflect the current JSON at click time.
  The ATS PDF stays text-only; the designed PDF embeds the same portrait from `cv.json`.
  The PDF "What I'm working on now" block shows every JSON item with a reduced field set
  (title, one-sentence description, labelled progress and optional academy URL), while the web
  keeps the richer cards. The earlier courses-only filter was removed after the human reported
  the mismatch between the web and the PDFs.
