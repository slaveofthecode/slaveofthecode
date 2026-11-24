import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { ragDbBase64 } from "../../data/rag-db.js";
import { sqlWasmBase64 } from "../../data/sql-wasm.js";
import {
  type RagChunk,
  type RagHit,
  type RagStore,
  cosineSimilarity,
} from "../../domain/rag.js";

export type RagRecord = RagChunk & { embedding: number[] };

export const RAG_META_KEYS = {
  cvSha256: "cv_sha256",
  embeddingModel: "embedding_model",
  builtAt: "built_at",
} as const;

export interface RagMeta {
  cvSha256: string;
  embeddingModel: string;
  builtAt: string;
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);`;

let sqlPromise: Promise<SqlJsStatic> | undefined;

/** Loads the sql.js (WASM) runtime once, using the embedded wasm binary. */
function loadSqlJs(): Promise<SqlJsStatic> {
  if (!sqlPromise) {
    const bytes = Buffer.from(sqlWasmBase64, "base64");
    const wasmBinary = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    );
    sqlPromise = initSqlJs({ wasmBinary });
  }
  return sqlPromise;
}

function encodeEmbedding(vector: number[]): Uint8Array {
  return new Uint8Array(Float32Array.from(vector).buffer);
}

function decodeEmbedding(bytes: Uint8Array): number[] {
  return Array.from(
    new Float32Array(bytes.buffer, bytes.byteOffset, bytes.byteLength / 4),
  );
}

/** Serializes chunks + embeddings into a SQLite database (for `build:rag`). */
export async function buildRagBytes(
  records: RagRecord[],
  meta: RagMeta,
): Promise<Uint8Array> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA);

  const insert = db.prepare(
    "INSERT INTO chunks (id, section, title, content, embedding) VALUES (?, ?, ?, ?, ?)",
  );
  const insertMeta = db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
  db.run("BEGIN TRANSACTION");
  for (const record of records) {
    insert.run([
      record.id,
      record.section,
      record.title,
      record.content,
      encodeEmbedding(record.embedding),
    ]);
  }
  insertMeta.run([RAG_META_KEYS.cvSha256, meta.cvSha256]);
  insertMeta.run([RAG_META_KEYS.embeddingModel, meta.embeddingModel]);
  insertMeta.run([RAG_META_KEYS.builtAt, meta.builtAt]);
  db.run("COMMIT");
  insert.free();
  insertMeta.free();

  const bytes = db.export();
  db.close();
  return bytes;
}

interface ChunkRow {
  id: string;
  section: string;
  title: string;
  content: string;
  embedding: Uint8Array;
}

/**
 * Read-only SQLite-backed vector store (sql.js, WASM — no native build). Loaded
 * from the committed snapshot; retrieval is brute-force cosine over the CV
 * chunks (the CV is small).
 */
export class SqliteRagStore implements RagStore {
  constructor(private readonly db: Database) {}

  static async open(bytes?: Uint8Array): Promise<SqliteRagStore> {
    const SQL = await loadSqlJs();
    const data = bytes ?? Uint8Array.from(Buffer.from(ragDbBase64, "base64"));
    return new SqliteRagStore(new SQL.Database(data));
  }

  retrieve(query: number[], limit: number): RagHit[] {
    const statement = this.db.prepare(
      "SELECT id, section, title, content, embedding FROM chunks",
    );
    const hits: RagHit[] = [];

    while (statement.step()) {
      const row = statement.getAsObject() as unknown as ChunkRow;
      hits.push({
        id: row.id,
        section: row.section,
        title: row.title,
        content: row.content,
        score: cosineSimilarity(query, decodeEmbedding(row.embedding)),
      });
    }
    statement.free();

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  getChunk(id: string): RagHit | null {
    const statement = this.db.prepare(
      "SELECT id, section, title, content FROM chunks WHERE id = ?",
    );
    statement.bind([id]);
    if (!statement.step()) {
      statement.free();
      return null;
    }
    const row = statement.getAsObject() as unknown as Omit<
      ChunkRow,
      "embedding"
    >;
    statement.free();
    return {
      id: row.id,
      section: row.section,
      title: row.title,
      content: row.content,
      score: 1,
    };
  }

  getMeta(): RagMeta | null {
    let statement: ReturnType<Database["prepare"]>;
    try {
      statement = this.db.prepare("SELECT key, value FROM meta");
    } catch {
      return null;
    }
    const values: Record<string, string> = {};

    while (statement.step()) {
      const row = statement.getAsObject() as unknown as {
        key: string;
        value: string;
      };
      values[row.key] = row.value;
    }
    statement.free();

    const cvSha256 = values[RAG_META_KEYS.cvSha256];
    const embeddingModel = values[RAG_META_KEYS.embeddingModel];
    const builtAt = values[RAG_META_KEYS.builtAt];
    if (!cvSha256 || !embeddingModel || !builtAt) return null;

    return { cvSha256, embeddingModel, builtAt };
  }
}
