import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { DEFAULT_EMBED_MODEL } from "../../config.js";
import { ragDbBase64 } from "../../data/rag-db.js";
import { CV_PATH, SNAPSHOT_PATH } from "./paths.js";
import { SqliteRagStore } from "./sqlite-store.js";

export { CV_PATH, SNAPSHOT_PATH } from "./paths.js";

export function sha256OfCv(cvPath = CV_PATH): string {
  return createHash("sha256").update(readFileSync(cvPath)).digest("hex");
}

export interface RagFreshnessResult {
  fresh: boolean;
  reasons: string[];
}

export interface RagFreshnessOptions {
  cvPath?: string;
  snapshotPath?: string;
  embeddedBase64?: string;
  embedModel?: string;
}

export async function checkRagFreshness(
  options: RagFreshnessOptions = {},
): Promise<RagFreshnessResult> {
  const cvPath = options.cvPath ?? CV_PATH;
  const snapshotPath = options.snapshotPath ?? SNAPSHOT_PATH;
  const embeddedBase64 = options.embeddedBase64 ?? ragDbBase64;
  const embedModel =
    options.embedModel || process.env.GEMINI_EMBED_MODEL || DEFAULT_EMBED_MODEL;
  const reasons: string[] = [];

  const expectedHash = sha256OfCv(cvPath);
  const embeddedBytes = Uint8Array.from(Buffer.from(embeddedBase64, "base64"));

  let committedBytes: Uint8Array;
  try {
    committedBytes = new Uint8Array(readFileSync(snapshotPath));
  } catch {
    reasons.push(`RAG snapshot file is missing: ${snapshotPath}`);
    committedBytes = new Uint8Array();
  }

  if (!Buffer.from(embeddedBytes).equals(Buffer.from(committedBytes))) {
    reasons.push("RAG snapshot file and embedded module are out of sync");
  }

  const store = await SqliteRagStore.open(embeddedBytes);
  const meta = store.getMeta();
  if (!meta) {
    reasons.push("RAG snapshot metadata is missing");
  } else {
    if (meta.cvSha256 !== expectedHash) {
      reasons.push(
        `cv.json hash changed: expected ${expectedHash}, snapshot has ${meta.cvSha256}`,
      );
    }
    if (meta.embeddingModel !== embedModel) {
      reasons.push(
        `embedding model changed: expected ${embedModel}, snapshot has ${meta.embeddingModel}`,
      );
    }
  }

  return { fresh: reasons.length === 0, reasons };
}
