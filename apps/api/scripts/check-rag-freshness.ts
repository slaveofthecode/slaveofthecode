import { checkRagFreshness } from "../src/adapters/rag/freshness.js";

const result = await checkRagFreshness();

if (result.fresh) {
  console.log("RAG snapshot is fresh.");
} else {
  console.error("RAG snapshot is stale:");
  for (const reason of result.reasons) console.error(`- ${reason}`);
  console.error(
    "Run `bun run --filter @portfolio/api build:rag` with GEMINI_API_KEY.",
  );
  process.exitCode = 1;
}
