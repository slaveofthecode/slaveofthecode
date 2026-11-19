import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { getContent, parseContent } from "@portfolio/content";
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

function getPopulatedContent() {
  return parseContent({
    profile: getContent().profile,
    certifications: [
      {
        id: "cert-test",
        name: "Test certification",
        issuer: "Test issuer",
        url: "https://learn.microsoft.com/en-us/users/slaveofthecode/transcript/demo?wt.mc_id=test&source=docs",
      },
    ],
    now: [
      {
        id: "now-test",
        kind: "course",
        title: "Test course",
        description: "A short test description.",
        pdfDescription: "A short PDF description.",
        progress: 21,
        status: "in-progress",
        updatedAt: "2026-11-01",
        academyUrl: "https://example.com/course?source=docs",
        links: [],
        tags: [],
      },
    ],
    personalProjects: [
      {
        id: "project-test",
        name: "Test project",
        description: "A short test project.",
        tech: [],
        repoUrl: "https://example.com/repo?source=docs",
        productionUrl: "https://example.com/app?source=docs",
        thumbnailUrl: "https://example.com/thumb.png",
      },
    ],
  });
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

  test("the PDFs include every Now item and add projects", async () => {
    const content = getPopulatedContent();

    for (const mode of ["designed", "ats"] as const) {
      const text = extractText(await renderCvPdf(content, mode));
      const flat = text.replace(/\s+/g, " ");

      const repoUrl = content.personalProjects[0]?.repoUrl ?? "";
      expect(text).toContain(strings.projects.heading.toUpperCase());
      expect(text).toContain(content.personalProjects[0]?.name ?? "");
      expect(text).toContain(repoUrl.split("?")[0]?.split("#")[0] ?? "");

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
      expect(text).not.toContain("WHAT I'M WORKING ON");
      expect(text).not.toContain("Tags:");
      expect(text).not.toContain("Updated:");
    }
  });

  test("only the designed PDF embeds the portrait", async () => {
    const content = getContent();
    const portraitBytes = await readFile(
      new URL("../public/images/profile/portrait.png", import.meta.url),
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
    const content = getPopulatedContent();
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
      expect(lines.join("\n")).not.toContain("source=docs");
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

  test("summary markdown is rendered with styled runs in both PDFs", async () => {
    const base = getContent();
    const content = {
      ...base,
      profile: {
        ...base.profile,
        summary:
          "Senior **+15 years** dev.\nLevel `B1/B2`.\nStack _preference_: React",
      },
    };

    for (const mode of ["designed", "ats"] as const) {
      const flat = extractText(await renderCvPdf(content, mode)).replace(
        /\s+/g,
        " ",
      );
      expect(flat).toContain(`${base.profile.yearsOfExperience} of experience`);
      expect(flat).toContain(`English level: ${base.profile.englishLevel}`);
      expect(flat).toContain("Senior +15 years dev.");
      expect(flat).toContain("Level B1/B2");
      expect(flat).toContain("Stack preference");
      expect(flat).toContain("React");
      expect(flat).not.toContain("**");
      expect(flat).not.toContain("`");
      expect(flat).not.toContain("_preference_");
    }
  });
});
