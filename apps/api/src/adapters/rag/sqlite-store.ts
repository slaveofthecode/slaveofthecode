import initSqlJs, { type Database, type SqlJsStatic } from "sql.js";
import { ragDbBase64 } from "../../data/rag-db.js";
import { sqlWasmBase64 } from "../../data/sql-wasm.js";
import type { ChatLocale } from "../../domain/chat.js";
import {
  type RagChunk,
  type RagHit,
  type RagStore,
  cosineSimilarity,
} from "../../domain/rag.js";

export type RagRecord = RagChunk & { embedding: number[] };

const SCHEMA = `
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  locale TEXT NOT NULL,
  section TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL
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
export async function buildRagBytes(records: RagRecord[]): Promise<Uint8Array> {
  const SQL = await loadSqlJs();
  const db = new SQL.Database();
  db.run(SCHEMA);

  const insert = db.prepare(
    "INSERT INTO chunks (id, locale, section, title, content, embedding) VALUES (?, ?, ?, ?, ?, ?)",
  );
  db.run("BEGIN TRANSACTION");
  for (const record of records) {
    insert.run([
      record.id,
      record.locale,
      record.section,
      record.title,
      record.content,
      new Uint8Array(Float32Array.from(record.embedding).buffer),
    ]);
  }
  db.run("COMMIT");
  insert.free();

  const bytes = db.export();
  db.close();
  return bytes;
}

interface ChunkRow {
  id: string;
  locale: string;
  section: string;
  title: string;
  content: string;
  embedding: Uint8Array;
}

/**
 * Read-only SQLite-backed vector store (sql.js, WASM — no native build). Loaded
 * from the committed snapshot; retrieval is brute-force cosine over that locale's
 * chunks (the CV is small).
 */
export class SqliteRagStore implements RagStore {
  constructor(private readonly db: Database) {}

  static async open(bytes?: Uint8Array): Promise<SqliteRagStore> {
    const SQL = await loadSqlJs();
    const data = bytes ?? Uint8Array.from(Buffer.from(ragDbBase64, "base64"));
    return new SqliteRagStore(new SQL.Database(data));
  }

  retrieve(query: number[], locale: ChatLocale, limit: number): RagHit[] {
    const statement = this.db.prepare(
      "SELECT id, locale, section, title, content, embedding FROM chunks WHERE locale = ?",
    );
    const hits: RagHit[] = [];

    statement.bind([locale]);
    while (statement.step()) {
      const row = statement.getAsObject() as unknown as ChunkRow;
      hits.push({
        id: row.id,
        locale: row.locale as ChatLocale,
        section: row.section,
        title: row.title,
        content: row.content,
        score: cosineSimilarity(
          query,
          Array.from(
            new Float32Array(
              row.embedding.buffer,
              row.embedding.byteOffset,
              row.embedding.byteLength / 4,
            ),
          ),
        ),
      });
    }
    statement.free();

    hits.sort((a, b) => b.score - a.score);
    return hits.slice(0, limit);
  }

  getChunk(id: string): RagHit | null {
    const statement = this.db.prepare(
      "SELECT id, locale, section, title, content FROM chunks WHERE id = ?",
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
      locale: row.locale as ChatLocale,
      section: row.section,
      title: row.title,
      content: row.content,
      score: 1,
    };
  }
}
