import { describe, expect, test } from "bun:test";
import { iconName, isSameOrigin } from "../src/lib/links";

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

describe("isSameOrigin", () => {
  test("matches links to the configured site only", () => {
    const site = new URL("https://slaveofthecode.vercel.app/");
    expect(isSameOrigin("https://slaveofthecode.vercel.app/", site)).toBe(true);
    expect(isSameOrigin("https://github.com/slaveofthecode", site)).toBe(false);
    expect(isSameOrigin("not a url", site)).toBe(false);
    expect(isSameOrigin("https://slaveofthecode.vercel.app/", undefined)).toBe(
      false,
    );
  });
});
