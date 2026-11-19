import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { getContent } from "@portfolio/content";
import { PDFDocument } from "pdf-lib";
import { renderCvPdf } from "../src/lib/cv-pdf";
import { strings } from "../src/lib/strings";

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

  test("the PDFs include every Now item and add personal projects", async () => {
    const content = getContent();

    for (const mode of ["designed", "ats"] as const) {
      const text = extractText(await renderCvPdf(content, mode));
      const flat = text.replace(/\s+/g, " ");

      expect(text).toContain("PERSONAL PROJECTS");
      expect(text).toContain(content.personalProjects[0]?.name ?? "");
      expect(text).toContain(content.personalProjects[0]?.repoUrl ?? "");

      for (const item of content.now) {
        expect(text).toContain(item.title);
        expect(flat).toContain(item.pdfDescription);
        expect(text).toContain(`${strings.now.progress}: ${item.progress}%`);
        if (item.academyUrl) {
          const url = item.academyUrl.split("?")[0]?.split("#")[0] ?? "";
          expect(flat).toContain(url);
        }
      }

      expect(text).toContain(strings.now.heading.toUpperCase());
      expect(text).not.toContain("WHAT I'M WORKING ON NOW");
      expect(text).not.toContain("Tags:");
      expect(text).not.toContain("Updated:");
    }
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

  test("both PDFs keep validation URLs unwrapped and label progress", async () => {
    const content = getContent();
    const certificate = content.certifications.find((item) => item.url);
    const course = content.now.find((item) => item.kind === "course");
    expect(certificate?.url).toBeDefined();
    expect(course).toBeDefined();

    const cleanUrl = certificate?.url?.split("?")[0]?.split("#")[0] ?? "";

    for (const mode of ["designed", "ats"] as const) {
      const lines = extractText(await renderCvPdf(content, mode))
        .split("\n")
        .map((line) => line.trim());

      if (certificate?.url) expect(lines).toContain(`Validate: ${cleanUrl}`);
      if (course) expect(lines).toContain(`Progress: ${course.progress}%`);
      expect(lines.join("\n")).not.toContain("wt.mc_id");
    }
  });

  test("empty collections omit their PDF sections", async () => {
    const content = {
      ...getContent(),
      experience: [],
      skills: [],
      languages: [],
      education: [],
      certifications: [],
      now: [],
      personalProjects: [],
    };
    const hiddenHeadings = [
      "EXPERIENCE",
      "SKILLS",
      "LANGUAGES",
      "EDUCATION",
      "CERTIFICATIONS",
      strings.now.heading.toUpperCase(),
      strings.projects.heading.toUpperCase(),
    ];

    for (const mode of ["designed", "ats"] as const) {
      const text = extractText(await renderCvPdf(content, mode));
      expect(text).toContain("SUMMARY");
      for (const heading of hiddenHeadings) expect(text).not.toContain(heading);
    }
  });
});
