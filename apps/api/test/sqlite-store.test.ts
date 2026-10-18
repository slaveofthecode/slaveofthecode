import { describe, expect, test } from "bun:test";
import {
  type RagRecord,
  SqliteRagStore,
  buildRagBytes,
} from "../src/adapters/rag/sqlite-store";

const records: RagRecord[] = [
  {
    id: "en:react",
    locale: "en",
    section: "experience",
    title: "React",
    content: "React job",
    embedding: [1, 0, 0],
  },
  {
    id: "en:node",
    locale: "en",
    section: "skills",
    title: "Node",
    content: "Node skills",
    embedding: [0, 1, 0],
  },
  {
    id: "es:node",
    locale: "es",
    section: "skills",
    title: "Node",
    content: "Node skills es",
    embedding: [1, 0, 0],
  },
];

describe("SqliteRagStore", () => {
  test("returns the nearest chunk for the query, scoped to the locale", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const hits = store.retrieve([1, 0, 0], "en", 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("en:react");
    expect(hits[0]?.score).toBeCloseTo(1);
  });

  test("orders by descending similarity and respects the limit", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const hits = store.retrieve([0, 1, 0], "en", 5);
    expect(hits.map((hit) => hit.id)).toEqual(["en:node", "en:react"]);
  });

  test("returns nothing for an empty snapshot", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes([]));
    expect(store.retrieve([1, 0, 0], "en", 5)).toEqual([]);
  });

  test("getChunk loads a chunk by id with a full score", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const chunk = store.getChunk("en:node");
    expect(chunk?.id).toBe("en:node");
    expect(chunk?.section).toBe("skills");
    expect(chunk?.content).toBe("Node skills");
    expect(chunk?.score).toBe(1);
  });

  test("getChunk returns null for an unknown id", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    expect(store.getChunk("en:missing")).toBeNull();
  });
});
