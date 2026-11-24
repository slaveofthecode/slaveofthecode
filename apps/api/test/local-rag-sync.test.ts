import { describe, expect, test } from "bun:test";
import type { RagFreshnessResult } from "../src/adapters/rag/freshness.js";
import { syncRagForLocalDev } from "../src/adapters/rag/local-sync.js";

const fresh: RagFreshnessResult = { fresh: true, reasons: [] };
const stale: RagFreshnessResult = {
  fresh: false,
  reasons: ["cv.json hash changed"],
};

function recorder() {
  const logs: string[] = [];
  const warnings: string[] = [];
  return {
    logs,
    warnings,
    log: (message: string) => logs.push(message),
    warn: (message: string) => warnings.push(message),
  };
}

describe("syncRagForLocalDev", () => {
  test("skips the rebuild when the snapshot is fresh", async () => {
    const output = recorder();
    let checks = 0;
    let builds = 0;

    const rebuilt = await syncRagForLocalDev({
      check: async () => {
        checks += 1;
        return fresh;
      },
      build: async () => {
        builds += 1;
      },
      ...output,
    });

    expect(rebuilt).toBe(false);
    expect(checks).toBe(1);
    expect(builds).toBe(0);
    expect(output.logs.join(" ")).toContain("skipping local rebuild");
  });

  test("rebuilds and rechecks when the snapshot is stale", async () => {
    const output = recorder();
    const results = [stale, fresh];
    let checks = 0;
    let builds = 0;

    const rebuilt = await syncRagForLocalDev({
      check: async () => results[checks++] ?? fresh,
      build: async () => {
        builds += 1;
      },
      hasApiKey: () => true,
      ...output,
    });

    expect(rebuilt).toBe(true);
    expect(checks).toBe(2);
    expect(builds).toBe(1);
    expect(output.logs.join(" ")).toContain("RAG snapshot rebuilt");
  });

  test("does not rebuild without an API key", async () => {
    const output = recorder();
    let builds = 0;

    const rebuilt = await syncRagForLocalDev({
      check: async () => stale,
      build: async () => {
        builds += 1;
      },
      hasApiKey: () => false,
      ...output,
    });

    expect(rebuilt).toBe(false);
    expect(builds).toBe(0);
    expect(output.warnings.join(" ")).toContain("GEMINI_API_KEY is missing");
  });

  test("throws when the snapshot is still stale after rebuilding", async () => {
    const output = recorder();

    expect(
      syncRagForLocalDev({
        check: async () => stale,
        build: async () => {},
        hasApiKey: () => true,
        ...output,
      }),
    ).rejects.toThrow("still stale after rebuild");
  });
});
