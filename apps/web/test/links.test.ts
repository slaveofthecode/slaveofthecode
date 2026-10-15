import { describe, expect, test } from "bun:test";
import { iconName } from "../src/lib/links";

describe("iconName", () => {
  test("maps known profile hosts", () => {
    expect(iconName("https://github.com/slaveofthecode")).toBe("github");
    expect(iconName("https://www.linkedin.com/in/gustavoml/")).toBe("linkedin");
  });

  test("falls back to the globe for other hosts", () => {
    expect(iconName("https://slaveofthecode.vercel.app/")).toBe("globe");
    expect(iconName("https://example.com/repo")).toBe("globe");
  });

  test("handles invalid URLs", () => {
    expect(iconName("not a url")).toBe("globe");
  });
});
