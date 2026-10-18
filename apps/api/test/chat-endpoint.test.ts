import { describe, expect, test } from "bun:test";
import { type HandlerDeps, createHandler } from "../src/adapters/http/router";
import { FakeProvider } from "../src/adapters/llm/fake-provider";
import { GeminiError } from "../src/adapters/llm/gemini-provider";
import {
  InMemoryDailyLimiter,
  InMemoryRateLimiter,
} from "../src/adapters/rate-limit/rate-limiter";
import { FakeEmbeddings, FakeStore, profileHit } from "./helpers";

const ORIGIN = "https://slaveofthecode.vercel.app";

function buildDeps(overrides: Partial<HandlerDeps> = {}): HandlerDeps {
  return {
    provider: new FakeProvider("Grounded answer."),
    embeddings: new FakeEmbeddings(),
    store: new FakeStore([profileHit("en"), profileHit("es")]),
    rateLimiter: new InMemoryRateLimiter(20, 60),
    dailyLimiter: new InMemoryDailyLimiter(200),
    allowedOrigins: [ORIGIN],
    ...overrides,
  };
}

function chatRequest(
  body: string,
  headers: Record<string, string> = {},
  method = "POST",
): Request {
  return new Request("http://localhost/chat", {
    method,
    headers: { "content-type": "application/json", origin: ORIGIN, ...headers },
    body,
  });
}

const validBody = JSON.stringify({
  messages: [{ role: "user", content: "What about React?" }],
  locale: "en",
});

describe("POST /chat", () => {
  test("returns the grounded reply with CORS headers", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(chatRequest(validBody));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: "Grounded answer." });
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  test("passes the retrieved excerpts in the system prompt", async () => {
    const provider = new FakeProvider("ok");
    const handler = createHandler(buildDeps({ provider }));
    await handler(chatRequest(validBody));
    expect(provider.lastSystem).toContain("CONTEXT excerpts");
    expect(provider.lastSystem).toContain("Gustavo Lopez");
  });

  test("400 on invalid body", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(
      chatRequest(JSON.stringify({ messages: [] })),
    );
    expect(response.status).toBe(400);
    expect(((await response.json()) as { error: string }).error).toBe(
      "invalid_request",
    );
  });

  test("400 on invalid json", async () => {
    const handler = createHandler(buildDeps());
    expect((await handler(chatRequest("not json"))).status).toBe(400);
  });

  test("405 on GET /chat", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(new Request("http://localhost/chat"));
    expect(response.status).toBe(405);
  });

  test("403 for a disallowed origin", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(
      chatRequest(validBody, { origin: "https://evil.example" }),
    );
    expect(response.status).toBe(403);
  });

  test("204 with CORS headers on OPTIONS", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(
      chatRequest("", { origin: ORIGIN }, "OPTIONS"),
    );
    expect(response.status).toBe(204);
    expect(response.headers.get("access-control-allow-origin")).toBe(ORIGIN);
  });

  test("413 for an oversized body", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(
      chatRequest(validBody, { "content-length": "999999" }),
    );
    expect(response.status).toBe(413);
  });

  test("429 when the rate limit is exceeded", async () => {
    const handler = createHandler(
      buildDeps({ rateLimiter: new InMemoryRateLimiter(1, 60) }),
    );
    expect((await handler(chatRequest(validBody))).status).toBe(200);
    const limited = await handler(chatRequest(validBody));
    expect(limited.status).toBe(429);
    expect(((await limited.json()) as { error: string }).error).toBe(
      "rate_limited",
    );
    expect(limited.headers.get("retry-after")).toBeDefined();
  });

  test("429 daily_limit_reached after the daily ceiling, without further LLM calls", async () => {
    const provider = new FakeProvider("ok");
    const handler = createHandler(
      buildDeps({ provider, dailyLimiter: new InMemoryDailyLimiter(1) }),
    );
    expect((await handler(chatRequest(validBody))).status).toBe(200);
    expect(provider.calls).toBe(1);

    const limited = await handler(chatRequest(validBody));
    expect(limited.status).toBe(429);
    expect(((await limited.json()) as { error: string }).error).toBe(
      "daily_limit_reached",
    );
    expect(limited.headers.get("retry-after")).toBeDefined();
    expect(provider.calls).toBe(1);
  });

  test("a per-IP block does not consume the daily budget", async () => {
    const handler = createHandler(
      buildDeps({
        rateLimiter: new InMemoryRateLimiter(1, 60),
        dailyLimiter: new InMemoryDailyLimiter(2),
      }),
    );
    // IP-A spends its per-IP slot (day budget: 1).
    expect(
      (await handler(chatRequest(validBody, { "x-forwarded-for": "1.1.1.1" })))
        .status,
    ).toBe(200);
    // Same IP is blocked; its attempts must NOT increment the daily counter.
    expect(
      (await handler(chatRequest(validBody, { "x-forwarded-for": "1.1.1.1" })))
        .status,
    ).toBe(429);
    // IP-B still has budget left (day budget: 2) because the blocked
    // requests above did not burn it.
    const other = await handler(
      chatRequest(validBody, { "x-forwarded-for": "2.2.2.2" }),
    );
    expect(other.status).toBe(200);
    expect(
      (await handler(chatRequest(validBody, { "x-forwarded-for": "3.3.3.3" })))
        .status,
    ).toBe(429);
  });

  test("502 when the provider fails upstream", async () => {
    const provider = {
      name: "boom",
      generate: () => Promise.reject(new GeminiError("upstream", 500)),
    };
    const handler = createHandler(buildDeps({ provider }));
    expect((await handler(chatRequest(validBody))).status).toBe(502);
  });

  test("500 on an unexpected provider error", async () => {
    const provider = {
      name: "boom",
      generate: () => Promise.reject(new Error("nope")),
    };
    const handler = createHandler(buildDeps({ provider }));
    expect((await handler(chatRequest(validBody))).status).toBe(500);
  });
});

describe("Vercel /api prefix", () => {
  test("routes /api/chat like /chat", async () => {
    const handler = createHandler(buildDeps());
    const request = new Request("https://api.example.com/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json", origin: ORIGIN },
      body: validBody,
    });
    const response = await handler(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ reply: "Grounded answer." });
  });

  test("routes /api/health like /health", async () => {
    const handler = createHandler(buildDeps());
    const response = await handler(
      new Request("https://api.example.com/api/health"),
    );
    expect(response.status).toBe(200);
  });
});
