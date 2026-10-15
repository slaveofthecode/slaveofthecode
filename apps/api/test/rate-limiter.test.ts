import { describe, expect, test } from "bun:test";
import { InMemoryRateLimiter } from "../src/adapters/rate-limit/rate-limiter";

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
