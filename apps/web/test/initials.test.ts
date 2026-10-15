import { describe, expect, test } from "bun:test";
import { initials } from "../src/lib/initials";

describe("initials", () => {
  test("first name + last name", () => {
    expect(initials("Gustavo Lopez")).toBe("GL");
  });

  test("ignores middle names", () => {
    expect(initials("Gustavo Andres Lopez")).toBe("GL");
  });

  test("single name yields one letter", () => {
    expect(initials("Gustavo")).toBe("G");
  });

  test("trims and collapses whitespace", () => {
    expect(initials("  Gustavo   Lopez  ")).toBe("GL");
  });

  test("empty name yields empty string", () => {
    expect(initials("   ")).toBe("");
  });
});
