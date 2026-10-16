import { afterEach, describe, expect, test } from "bun:test";
import { GeminiEmbeddings } from "../src/adapters/llm/gemini-embeddings";
import { GeminiError } from "../src/adapters/llm/gemini-provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const config = {
  apiKey: "k",
  model: "m",
  embedModel: "e",
  baseUrl: "https://g.test",
};

describe("GeminiEmbeddings", () => {
  test("returns one vector per input", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            embeddings: [{ values: [1, 2] }, { values: [3, 4] }],
          }),
          {
            status: 200,
          },
        ),
      )) as unknown as typeof fetch;

    const embeddings = new GeminiEmbeddings(config);
    expect(await embeddings.embed(["a", "b"])).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("throws GeminiError on failure", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response("bad", { status: 429 }),
      )) as unknown as typeof fetch;

    const embeddings = new GeminiEmbeddings(config);
    await expect(embeddings.embed(["a"])).rejects.toThrow(GeminiError);
  });

  test("throws without an API key", async () => {
    const embeddings = new GeminiEmbeddings({ ...config, apiKey: "" });
    await expect(embeddings.embed(["a"])).rejects.toThrow(GeminiError);
  });
});
