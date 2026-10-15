# ADR-0006 Recruiter chat backend: RAG over a SQLite vector store

- **Context:** recruiters should ask questions about the CV and get grounded answers
  ("What has he done with React?"). Supersedes ADR-0004 (context stuffing): we now do
  retrieval-augmented generation with embeddings and a local database.
- **Decision:**
  - **Pipeline:** ingest → chunk the validated CV → embed each chunk → store in SQLite.
    At query time: embed the question → retrieve the top-k chunks by cosine similarity
    → pass them as the only context to the model.
  - **Source of truth:** the chunks are built from `@portfolio/content` (every locale,
    including `now`) — the exact data shown on the web. No PDF parsing at request time.
  - **Store:** **SQLite** via `sql.js` (WASM, no native build), so the same code runs on
    Bun, Node and Vercel. The snapshot is a small, committed artifact: `apps/api/data/cv.sqlite`
    plus the runtime module `apps/api/src/data/rag-db.ts` (base64), regenerated with
    `bun run build:rag`. Retrieval is brute-force cosine over that locale's chunks.
  - **Embeddings + chat:** Google Gemini (REST via `fetch`, no SDK), behind
    `EmbeddingProvider` / `LlmProvider` interfaces. Models are configurable
    (`GEMINI_EMBED_MODEL`, `GEMINI_MODEL`).
  - **Hosting:** a second Vercel project for `apps/api` (Node runtime, Web Standard
    `fetch` handler). AWS Lambda stays the long-term target (ADR-0005).
  - **No streaming** in v1: `POST /chat` returns JSON `{ reply }`. The server is
    stateless (the client sends the last N turns) and answers in the site locale.
  - **Guardrails:** answer ONLY from the retrieved excerpts; say "I don't have that
    information" otherwise; refuse off-topic; resist prompt injection; never dump the
    system prompt.
  - **Limits:** per-IP in-memory rate limit, max messages/chars, max output tokens,
    CORS restricted to the site origin.
- **Consequences:** real RAG with zero external services (the DB is a committed file),
  cheap and reproducible. Cost: `build:rag` needs `GEMINI_API_KEY` and must be re-run
  when the CV changes; on serverless the SQLite snapshot is read-only (bundled, not
  persisted). Revisit if the corpus grows a lot.
