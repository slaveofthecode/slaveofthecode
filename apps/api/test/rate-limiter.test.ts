import { describe, expect, test } from "bun:test";
import {
  InMemoryDailyLimiter,
  InMemoryRateLimiter,
} from "../src/adapters/rate-limit/rate-limiter";

describe("InMemoryRateLimiter", () => {
  test("allows up to the limit then blocks", async () => {
    const limiter = new InMemoryRateLimiter(2, 60, () => 1_000);
    expect((await limiter.check("ip")).allowed).toBe(true);
    expect((await limiter.check("ip")).allowed).toBe(true);
    const blocked = await limiter.check("ip");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  test("resets after the window", async () => {
    let now = 1_000;
    const limiter = new InMemoryRateLimiter(1, 60, () => now);
    expect((await limiter.check("ip")).allowed).toBe(true);
    expect((await limiter.check("ip")).allowed).toBe(false);
    now += 60_001;
    expect((await limiter.check("ip")).allowed).toBe(true);
  });

  test("keys are independent", async () => {
    const limiter = new InMemoryRateLimiter(1, 60, () => 1_000);
    expect((await limiter.check("a")).allowed).toBe(true);
    expect((await limiter.check("b")).allowed).toBe(true);
  });
});

describe("InMemoryDailyLimiter", () => {
  test("allows up to the ceiling then blocks with a retry hint", async () => {
    const now = Date.UTC(2026, 9, 18, 12, 0, 0);
    const limiter = new InMemoryDailyLimiter(2, () => now);
    expect((await limiter.check("chat:day")).allowed).toBe(true);
    expect((await limiter.check("chat:day")).allowed).toBe(true);
    const blocked = await limiter.check("chat:day");
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(12 * 3600);
  });

  test("resets exactly at the next UTC midnight", async () => {
    let now = Date.UTC(2026, 9, 18, 23, 59, 30);
    const limiter = new InMemoryDailyLimiter(1, () => now);
    expect((await limiter.check("chat:day")).allowed).toBe(true);
    expect((await limiter.check("chat:day")).allowed).toBe(false);

    now = Date.UTC(2026, 9, 19, 0, 0, 0);
    expect((await limiter.check("chat:day")).allowed).toBe(true);
  });

  test("the shared key makes every caller share one budget", async () => {
    const now = Date.UTC(2026, 9, 18, 12, 0, 0);
    const limiter = new InMemoryDailyLimiter(2, () => now);
    expect((await limiter.check("client-a")).allowed).toBe(true);
    expect((await limiter.check("client-b")).allowed).toBe(true);
    expect((await limiter.check("client-c")).allowed).toBe(false);
  });
});
