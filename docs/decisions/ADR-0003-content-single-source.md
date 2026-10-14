# ADR-0003 `packages/content` is the single source of truth; PDF is ingest input

- **Context:** the website, the future chat and any generated PDF all need the same
  CV facts; the current source is a PDF.
- **Decision:** validated JSON (Zod) in `packages/content/data/{en,es}` is the only
  source of truth. The PDF lives in the gitignored `content-source/` and is read once
  by an ingest step, never at runtime.
- **Consequences:** one place to edit facts, parity tests keep locales aligned, no PDF
  parsing in production. Cost: an explicit ingest + human-review step per update.
