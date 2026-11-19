import { describe, expect, test } from "bun:test";
import {
  type RagRecord,
  SqliteRagStore,
  buildRagBytes,
} from "../src/adapters/rag/sqlite-store";

const records: RagRecord[] = [
  {
    id: "react",
    section: "experience",
    title: "React",
    content: "React job",
    embedding: [1, 0, 0],
  },
  {
    id: "node",
    section: "skills",
    title: "Node",
    content: "Node skills",
    embedding: [0, 1, 0],
  },
];

describe("SqliteRagStore", () => {
  test("returns the nearest chunk for the query", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const hits = store.retrieve([1, 0, 0], 1);
    expect(hits).toHaveLength(1);
    expect(hits[0]?.id).toBe("react");
    expect(hits[0]?.score).toBeCloseTo(1);
  });

  test("orders by descending similarity and respects the limit", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const hits = store.retrieve([0, 1, 0], 5);
    expect(hits.map((hit) => hit.id)).toEqual(["node", "react"]);
  });

  test("returns nothing for an empty snapshot", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes([]));
    expect(store.retrieve([1, 0, 0], 5)).toEqual([]);
  });

  test("getChunk loads a chunk by id with a full score", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    const chunk = store.getChunk("node");
    expect(chunk?.id).toBe("node");
    expect(chunk?.section).toBe("skills");
    expect(chunk?.content).toBe("Node skills");
    expect(chunk?.score).toBe(1);
  });

  test("getChunk returns null for an unknown id", async () => {
    const store = await SqliteRagStore.open(await buildRagBytes(records));
    expect(store.getChunk("missing")).toBeNull();
  });
});
