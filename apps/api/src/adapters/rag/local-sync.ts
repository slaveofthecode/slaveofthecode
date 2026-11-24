import { buildRagSnapshot } from "./build-snapshot.js";
import {
  type RagFreshnessOptions,
  type RagFreshnessResult,
  checkRagFreshness,
} from "./freshness.js";

export interface LocalRagSyncDeps {
  check?: (options?: RagFreshnessOptions) => Promise<RagFreshnessResult>;
  build?: () => Promise<void>;
  log?: (message: string) => void;
  warn?: (message: string) => void;
  hasApiKey?: () => boolean;
}

export async function syncRagForLocalDev(
  deps: LocalRagSyncDeps = {},
): Promise<boolean> {
  const check = deps.check ?? checkRagFreshness;
  const build = deps.build ?? buildRagSnapshot;
  const log = deps.log ?? console.log;
  const warn = deps.warn ?? console.warn;
  const hasApiKey =
    deps.hasApiKey ?? (() => Boolean(process.env.GEMINI_API_KEY));

  const before = await check();
  if (before.fresh) {
    log("RAG snapshot is fresh; skipping local rebuild.");
    return false;
  }

  for (const reason of before.reasons) warn(`- ${reason}`);
  if (!hasApiKey()) {
    warn("GEMINI_API_KEY is missing; skipping local RAG rebuild.");
    return false;
  }

  log("RAG snapshot is stale; rebuilding it locally.");
  await build();

  const after = await check();
  if (!after.fresh) {
    throw new Error(
      `RAG snapshot is still stale after rebuild: ${after.reasons.join("; ")}`,
    );
  }

  log("RAG snapshot rebuilt.");
  return true;
}
