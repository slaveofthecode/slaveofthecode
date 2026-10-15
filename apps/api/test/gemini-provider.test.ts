import { afterEach, describe, expect, test } from "bun:test";
import {
  GeminiError,
  GeminiProvider,
} from "../src/adapters/llm/gemini-provider";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

const options = { system: "SYSTEM" };
const config = {
  apiKey: "k",
  model: "m",
  embedModel: "e",
  baseUrl: "https://g.test",
};

describe("GeminiProvider", () => {
  test("returns the joined candidate text", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: "Hello " }, { text: "world" }] } },
            ],
          }),
          { status: 200 },
        ),
      )) as unknown as typeof fetch;

    const provider = new GeminiProvider(config);
    expect(
      await provider.generate([{ role: "user", content: "hi" }], options),
    ).toBe("Hello world");
  });

  test("throws GeminiError on a non-2xx response", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response("nope", { status: 500 }),
      )) as unknown as typeof fetch;

    const provider = new GeminiProvider(config);
    await expect(
      provider.generate([{ role: "user", content: "hi" }], options),
    ).rejects.toThrow(GeminiError);
  });

  test("throws when the response has no text", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ candidates: [] }), { status: 200 }),
      )) as unknown as typeof fetch;

    const provider = new GeminiProvider(config);
    await expect(
      provider.generate([{ role: "user", content: "hi" }], options),
    ).rejects.toThrow(GeminiError);
  });

  test("throws when the API key is missing", async () => {
    const provider = new GeminiProvider({ ...config, apiKey: "" });
    await expect(
      provider.generate([{ role: "user", content: "hi" }], options),
    ).rejects.toThrow(GeminiError);
  });
});
