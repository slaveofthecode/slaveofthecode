import { describe, expect, test } from "bun:test";
import { inflateSync } from "node:zlib";
import { getContent } from "@portfolio/content";
import { PDFDocument } from "pdf-lib";
import { renderCvPdf } from "../src/lib/cv-pdf";

function extractText(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  const streams = [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map(
    (match) =>
      inflateSync(Buffer.from(match[1] ?? "", "latin1")).toString("latin1"),
  );
  return [...streams.join("\n").matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)]
    .map((match) => Buffer.from(match[1] ?? "", "hex").toString("latin1"))
    .join("\n");
}

describe("renderCvPdf", () => {
  test("both variants produce valid PDFs from the single JSON source", async () => {
    const content = getContent();
    for (const mode of ["designed", "ats"] as const) {
      const bytes = await renderCvPdf(content, mode);
      expect(new TextDecoder().decode(bytes.subarray(0, 5))).toBe("%PDF-");
      const doc = await PDFDocument.load(bytes);
      expect(doc.getPageCount()).toBeGreaterThan(0);
    }
  });

  test("the ATS variant contains plain-text contact data and sections", async () => {
    const content = getContent();
    const bytes = await renderCvPdf(content, "ats");
    const text = extractText(bytes);
    expect(text).toContain(content.profile.name);
    expect(text).toContain("Email:");
    expect(text).toContain("EXPERIENCE");
  });
});
