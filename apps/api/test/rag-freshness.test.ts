import { afterEach, describe, expect, test } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import initSqlJs from "sql.js";
import {
  checkRagFreshness,
  sha256OfCv,
} from "../src/adapters/rag/freshness.js";
import {
  type RagMeta,
  buildRagBytes,
} from "../src/adapters/rag/sqlite-store.js";
import { sqlWasmBase64 } from "../src/data/sql-wasm.js";

const tempDirs: string[] = [];

function fixture(cvJson = '{"name":"Gustavo"}') {
  const dir = mkdtempSync(join(tmpdir(), "rag-freshness-"));
  tempDirs.push(dir);
  const cvPath = join(dir, "cv.json");
  const snapshotPath = join(dir, "cv.sqlite");
  writeFileSync(cvPath, cvJson);
  return { cvPath, snapshotPath };
}

async function writeSnapshot(
  snapshotPath: string,
  meta: RagMeta,
): Promise<Uint8Array> {
  const bytes = await buildRagBytes([], meta);
  writeFileSync(snapshotPath, bytes);
  return bytes;
}

afterEach(() => {
  for (const dir of tempDirs) rmSync(dir, { recursive: true, force: true });
  tempDirs.length = 0;
});

describe("checkRagFreshness", () => {
  test("accepts a snapshot whose hash matches cv.json", async () => {
    const { cvPath, snapshotPath } = fixture();
    const meta: RagMeta = {
      cvSha256: sha256OfCv(cvPath),
      embeddingModel: "test-embed-model",
      builtAt: "2026-01-01T00:00:00.000Z",
    };
    const bytes = await writeSnapshot(snapshotPath, meta);

    const result = await checkRagFreshness({
      cvPath,
      snapshotPath,
      embeddedBase64: Buffer.from(bytes).toString("base64"),
      embedModel: "test-embed-model",
    });

    expect(result).toEqual({ fresh: true, reasons: [] });
  });

  test("rejects a changed cv.json", async () => {
    const { cvPath, snapshotPath } = fixture();
    const meta: RagMeta = {
      cvSha256: sha256OfCv(cvPath),
      embeddingModel: "test-embed-model",
      builtAt: "2026-01-01T00:00:00.000Z",
    };
    const bytes = await writeSnapshot(snapshotPath, meta);
    writeFileSync(cvPath, '{"name":"Changed"}');

    const result = await checkRagFreshness({
      cvPath,
      snapshotPath,
      embeddedBase64: Buffer.from(bytes).toString("base64"),
      embedModel: "test-embed-model",
    });

    expect(result.fresh).toBe(false);
    expect(result.reasons.join(" ")).toContain("cv.json hash changed");
  });

  test("rejects an embedded module that differs from cv.sqlite", async () => {
    const { cvPath, snapshotPath } = fixture();
    const meta: RagMeta = {
      cvSha256: sha256OfCv(cvPath),
      embeddingModel: "test-embed-model",
      builtAt: "2026-01-01T00:00:00.000Z",
    };
    const bytes = await writeSnapshot(snapshotPath, meta);
    const otherBytes = await buildRagBytes([], {
      ...meta,
      builtAt: "2026-01-02T00:00:00.000Z",
    });

    const result = await checkRagFreshness({
      cvPath,
      snapshotPath,
      embeddedBase64: Buffer.from(otherBytes).toString("base64"),
      embedModel: "test-embed-model",
    });

    expect(result.fresh).toBe(false);
    expect(result.reasons).toContain(
      "RAG snapshot file and embedded module are out of sync",
    );
  });

  test("rejects an embedding model change", async () => {
    const { cvPath, snapshotPath } = fixture();
    const meta: RagMeta = {
      cvSha256: sha256OfCv(cvPath),
      embeddingModel: "old-embed-model",
      builtAt: "2026-01-01T00:00:00.000Z",
    };
    const bytes = await writeSnapshot(snapshotPath, meta);

    const result = await checkRagFreshness({
      cvPath,
      snapshotPath,
      embeddedBase64: Buffer.from(bytes).toString("base64"),
      embedModel: "new-embed-model",
    });

    expect(result.fresh).toBe(false);
    expect(result.reasons.join(" ")).toContain("embedding model changed");
  });

  test("rejects a snapshot without provenance metadata", async () => {
    const { cvPath, snapshotPath } = fixture();
    const wasmBytes = Buffer.from(sqlWasmBase64, "base64");
    const wasmBinary = wasmBytes.buffer.slice(
      wasmBytes.byteOffset,
      wasmBytes.byteOffset + wasmBytes.byteLength,
    );
    const SQL = await initSqlJs({ wasmBinary });
    const db = new SQL.Database();
    db.run(
      "CREATE TABLE chunks (id TEXT PRIMARY KEY, section TEXT NOT NULL, title TEXT NOT NULL, content TEXT NOT NULL, embedding BLOB NOT NULL);",
    );
    const bytes = db.export();
    db.close();
    writeFileSync(snapshotPath, bytes);

    const result = await checkRagFreshness({
      cvPath,
      snapshotPath,
      embeddedBase64: Buffer.from(bytes).toString("base64"),
      embedModel: "test-embed-model",
    });

    expect(result.fresh).toBe(false);
    expect(result.reasons).toContain("RAG snapshot metadata is missing");
  });
});
