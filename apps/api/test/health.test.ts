import { describe, expect, test } from "bun:test";
import { handleRequest } from "../src/index";

describe("GET /health", () => {
  test("returns an ok payload", async () => {
    const response = await handleRequest(
      new Request("http://localhost/health"),
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.service).toBe("portfolio-api");
    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(String(body.timestamp)))).toBe(false);
  });

  test("404 for unknown paths", async () => {
    const response = await handleRequest(new Request("http://localhost/nope"));
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "not_found" });
  });

  test("405 for non-GET on /health", async () => {
    const response = await handleRequest(
      new Request("http://localhost/health", { method: "POST" }),
    );
    expect(response.status).toBe(405);
  });
});
