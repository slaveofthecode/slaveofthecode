import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dir, "..");
const STATUS_PATH = join(ROOT, "docs", "STATUS.md");
const MARKER = "<!-- rag-sync-log -->";

const sourceSha = process.env.RAG_SYNC_SOURCE_SHA;
const runId = process.env.RAG_SYNC_RUN_ID;
if (!sourceSha || !runId) {
  throw new Error("RAG_SYNC_SOURCE_SHA and RAG_SYNC_RUN_ID are required");
}

let status = readFileSync(STATUS_PATH, "utf8");
if (!status.includes(MARKER)) {
  throw new Error(`Missing ${MARKER} in docs/STATUS.md`);
}

const line = `- Automated RAG snapshot sync for cv.json commit \`${sourceSha}\` (workflow run ${runId}).`;
if (!status.includes(line)) {
  status = status.replace(MARKER, `${MARKER}\n${line}`);
  writeFileSync(STATUS_PATH, status);
}
