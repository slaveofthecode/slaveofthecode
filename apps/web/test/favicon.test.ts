import { describe, expect, test } from "bun:test";
import { renderInitialsIcon } from "../src/lib/favicon";

describe("renderInitialsIcon", () => {
  test("renders a square svg with the initials", () => {
    const svg = renderInitialsIcon("GL");
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain(">GL</text>");
    expect(svg).toContain('aria-label="GL"');
    expect(svg).toContain('viewBox="0 0 64 64"');
  });

  test("escapes the initials", () => {
    const svg = renderInitialsIcon("<&");
    expect(svg).toContain("&lt;&amp;");
    expect(svg).not.toContain(">&<");
  });
});
