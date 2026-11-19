import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
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

  test("the PDFs use the reduced Now layout and add personal projects", async () => {
    const content = getContent();
    const bytes = await renderCvPdf(content, "ats");
    const text = extractText(bytes);
    const flat = text.replace(/\s+/g, " ");

    expect(text).toContain("PERSONAL PROJECTS");
    expect(text).toContain(content.personalProjects[0]?.name ?? "");
    expect(text).toContain(content.personalProjects[0]?.repoUrl ?? "");

    const course = content.now.find((item) => item.kind === "course");
    expect(course).toBeDefined();
    if (course) {
      expect(flat).toContain(course.pdfDescription);
      expect(flat).toContain(course.academyUrl ?? "");
    }

    const project = content.now.find((item) => item.kind === "project");
    if (project) expect(text).not.toContain(project.title);
    expect(text).not.toContain("Tags:");
    expect(text).not.toContain("Updated:");
  });

  test("only the designed PDF embeds the portrait", async () => {
    const content = getContent();
    const portraitBytes = await readFile(
      new URL("../public/portrait.png", import.meta.url),
    );
    const designed = await renderCvPdf(content, "designed", { portraitBytes });
    const ats = await renderCvPdf(content, "ats", { portraitBytes });

    expect(Buffer.from(designed).toString("latin1")).toContain(
      "/Subtype /Image",
    );
    expect(Buffer.from(ats).toString("latin1")).not.toContain(
      "/Subtype /Image",
    );
  });
});
