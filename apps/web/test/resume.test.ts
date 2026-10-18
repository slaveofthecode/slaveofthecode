import { describe, expect, test } from "bun:test";
import { resumeFilename } from "../src/lib/resume";

describe("resumeFilename", () => {
  test("first + last name", () => {
    expect(resumeFilename("Gustavo Lopez")).toBe("Gustavo_Lopez_resume.pdf");
  });

  test("single name", () => {
    expect(resumeFilename("Cher")).toBe("Cher_resume.pdf");
  });

  test("keeps unicode letters, collapses other runs into one underscore", () => {
    expect(resumeFilename("  Ana María O'Neill  ")).toBe(
      "Ana_María_O_Neill_resume.pdf",
    );
  });

  test("extra internal whitespace counts as one separator", () => {
    expect(resumeFilename("Jean  Luc")).toBe("Jean_Luc_resume.pdf");
  });

  test("empty or symbol-only names fall back to resume.pdf", () => {
    expect(resumeFilename("")).toBe("resume.pdf");
    expect(resumeFilename("   ")).toBe("resume.pdf");
    expect(resumeFilename("!!!")).toBe("resume.pdf");
  });
});
