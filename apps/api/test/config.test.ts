import { describe, expect, test } from "bun:test";
import { loadConfig } from "../src/config";

describe("loadConfig rate limits", () => {
  test("uses the cost-cap defaults", () => {
    const config = loadConfig({});
    expect(config.rateLimit).toEqual({
      maxRequests: 10,
      windowSeconds: 60,
      dailyMax: 200,
    });
  });

  test("reads overrides from the environment", () => {
    const config = loadConfig({
      RATE_LIMIT_MAX: "5",
      RATE_LIMIT_WINDOW_SECONDS: "30",
      RATE_LIMIT_DAILY_MAX: "50",
    });
    expect(config.rateLimit).toEqual({
      maxRequests: 5,
      windowSeconds: 30,
      dailyMax: 50,
    });
  });

  test("ignores invalid values instead of disabling the cap", () => {
    const config = loadConfig({
      RATE_LIMIT_MAX: "0",
      RATE_LIMIT_DAILY_MAX: "-1",
      RATE_LIMIT_WINDOW_SECONDS: "abc",
    });
    expect(config.rateLimit).toEqual({
      maxRequests: 10,
      windowSeconds: 60,
      dailyMax: 200,
    });
  });
});
