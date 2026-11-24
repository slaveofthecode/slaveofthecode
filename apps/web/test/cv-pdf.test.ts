import { describe, expect, setSystemTime, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { getContent, parseContent } from "@portfolio/content";
import { PDFDocument } from "pdf-lib";
import { renderCvPdf } from "../src/lib/cv-pdf";
import { formatLongDate } from "../src/lib/dates";
import { sortProjectsByLastCommit } from "../src/lib/projects";
import { strings } from "../src/lib/strings";

function extractStreams(bytes: Uint8Array): string {
  const raw = Buffer.from(bytes).toString("latin1");
  return [...raw.matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)]
    .map((match) =>
      inflateSync(Buffer.from(match[1] ?? "", "latin1")).toString("latin1"),
    )
    .join("\n");
}

function extractText(bytes: Uint8Array): string {
  return [...extractStreams(bytes).matchAll(/<([0-9A-Fa-f]+)>\s*Tj/g)]
    .map((match) => Buffer.from(match[1] ?? "", "hex").toString("latin1"))
    .join("\n");
}

interface TextPlacement {
  x: number;
  y: number;
  font: string;
}

function findTextPlacement(
  streams: string,
  label: string,
): TextPlacement | undefined {
  const lines = streams.split("\n");
  for (const [index, line] of lines.entries()) {
    const match = /<([0-9A-Fa-f]+)>\s*Tj/.exec(line);
    if (!match) continue;
    if (Buffer.from(match[1] ?? "", "hex").toString("latin1") !== label)
      continue;
    const context = lines.slice(Math.max(0, index - 8), index).join("\n");
    const transform = /1 0 0 1 ([-\d.]+) ([-\d.]+) Tm/.exec(context);
    if (!transform) continue;
    return {
      x: Number(transform[1]),
      y: Number(transform[2]),
      font: /(\/[\w-]+) [\d.]+ Tf/.exec(context)?.[1] ?? "",
    };
  }
  return undefined;
}

function cleanUrl(value: string): string {
  return value.split("?")[0]?.split("#")[0] ?? "";
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
        imageUrl: "/images/certifications/cert.png",
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
        lastCommit: "2026-11-01",
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

  test("designed PDF renders header links as labeled clickable links", async () => {
    const content = getContent();
    const bytes = await renderCvPdf(content, "designed");
    const designed = extractText(bytes).replace(/\s+/g, " ");
    const raw = Buffer.from(bytes).toString("latin1");
    const ats = extractText(await renderCvPdf(content, "ats"));

    for (const link of content.profile.links) {
      expect(designed).toContain(link.label);
      expect(designed).not.toContain(link.url);
      expect(raw).toContain(link.url);
      expect(ats).toContain(`${link.label}: ${cleanUrl(link.url)}`);
    }
    expect(raw).toContain("/Subtype /Link");
  });

  test("PDFs attach tech to each project", async () => {
    const text = extractText(await renderCvPdf(getContent(), "ats"));
    expect(text).toContain("Tech: Meteor,");
    expect(text).toContain("Tech: Java, Spring Boot,");
  });

  test("designed PDF renders language bars from proficiency percentages", async () => {
    const designed = extractStreams(
      await renderCvPdf(getContent(), "designed"),
    );
    const ats = extractStreams(await renderCvPdf(getContent(), "ats"));
    expect(designed.match(/0\.8 0\.8 0\.8 rg/g) ?? []).toHaveLength(3);
    expect(ats).not.toContain("0.8 0.8 0.8 rg");
  });

  test("designed PDF renders project cards with link labels instead of URLs", async () => {
    const content = getContent();
    const bytes = await renderCvPdf(content, "designed");
    const streams = extractStreams(bytes);
    const flat = extractText(bytes).replace(/\s+/g, " ");
    const raw = Buffer.from(bytes).toString("latin1");

    expect(streams).toContain("0.965 0.965 0.965 rg");
    expect(flat).toContain(strings.projects.repo);
    expect(flat).toContain(strings.projects.live);
    expect(flat).toContain("Tech: Next.js, React,");
    for (const project of content.personalProjects) {
      expect(flat).not.toContain(cleanUrl(project.repoUrl));
      expect(flat).not.toContain(cleanUrl(project.productionUrl));
      expect(raw).toContain(project.repoUrl);
      expect(raw).toContain(project.productionUrl);
    }

    const ats = extractText(await renderCvPdf(content, "ats"));
    expect(ats).toContain(
      `Repo: ${cleanUrl(content.personalProjects[0]?.repoUrl ?? "")}`,
    );
  });

  test("designed PDF renders experience cards with bullets and inline dates", async () => {
    const content = getContent();
    const designed = extractText(
      await renderCvPdf(content, "designed"),
    ).replace(/\s+/g, " ");
    const ats = extractText(await renderCvPdf(content, "ats"));

    expect(designed).toContain(`${content.experience[0]?.company} |`);
    expect(designed).toContain(
      content.experience[0]?.projects?.[0]?.name?.trim() || "Project",
    );
    expect(designed).not.toContain("Dates:");
    expect(ats).toContain("Dates:");
  });

  test("designed PDF renders Skills as a two-column table", async () => {
    const content = getContent();
    const designed = extractText(
      await renderCvPdf(content, "designed"),
    ).replace(/\s+/g, " ");
    const ats = extractText(await renderCvPdf(content, "ats"));

    expect(designed).toContain(strings.skills.category.toUpperCase());
    expect(designed).toContain(strings.skills.technologies.toUpperCase());
    expect(designed).toContain(content.skills[0]?.name ?? "");
    expect(designed).toContain(
      content.skills[0]?.items.slice(0, 2).join(", ") ?? "",
    );
    expect(designed).not.toContain(`${content.skills[0]?.name}:`);
    expect(ats).toContain(`${content.skills[0]?.name}:`);
  });

  test("designed PDF styles Now and Certifications without raw URLs", async () => {
    const content = getPopulatedContent();
    const course = content.now[0];
    const certification = content.certifications[0];
    const bytes = await renderCvPdf(content, "designed");
    const streams = extractStreams(bytes);
    const flat = extractText(bytes).replace(/\s+/g, " ");
    const raw = Buffer.from(bytes).toString("latin1");
    const certUrl = cleanUrl(certification?.url ?? "");
    const academyUrl = cleanUrl(course?.academyUrl ?? "");

    expect(streams).toContain("0.32 0.32 0.32 rg");
    expect(streams).toContain("0.35 0.35 0.35 rg");
    expect(flat).not.toContain(certUrl);
    expect(flat).not.toContain(academyUrl);
    expect(flat).toContain(strings.certifications.validate);
    if (certification) {
      expect(flat).toContain(
        `${certification.name} ${strings.certifications.validate}`,
      );
      expect(raw).toContain(certification.url ?? "");
    }
    expect(flat).toContain(strings.now.academy);
    if (course) {
      expect(flat).toContain(course.title);
      expect(flat).toContain(strings.now.kind[course.kind]);
      expect(raw).toContain(course.academyUrl ?? "");
    }

    const ats = extractText(await renderCvPdf(content, "ats"));
    expect(ats).toContain(`Academy: ${academyUrl}`);
  });

  test("the ATS variant contains plain-text contact data and sections", async () => {
    const content = getContent();
    const bytes = await renderCvPdf(content, "ats");
    const text = extractText(bytes);
    expect(text).toContain(content.profile.name);
    expect(text).toContain("Email:");
    expect(text).toContain("EXPERIENCE");
  });

  test("ATS header uses the ATS-only phone without showing it in designed PDF", async () => {
    const content = getContent();
    const ats = extractText(await renderCvPdf(content, "ats"));
    const designed = extractText(await renderCvPdf(content, "designed"));

    expect(ats).toContain(`Phone: ${content.profile.atsPhone}`);
    if (content.profile.atsPhone) {
      expect(designed).not.toContain(content.profile.atsPhone);
    }
  });

  test("ATS collapses experience started 15 or more years ago", async () => {
    setSystemTime(new Date("2026-11-19T00:00:00Z"));
    try {
      const content = getContent();
      const ats = extractText(await renderCvPdf(content, "ats")).replace(
        /\s+/g,
        " ",
      );
      const designed = extractText(await renderCvPdf(content, "designed"));

      expect(ats).toContain(strings.cv.earlierExperience.toUpperCase());
      expect(ats).toContain("Dicicom (Jun 2007");
      expect(ats).toContain("Full-Stack Developer | SQL-HTML-JS");
      expect(ats).toContain("Bancor (Jun 2008");
      expect(ats).toContain("Full-Stack Developer | C#-SQL-DTS/DTSX-JS-.Net");
      expect(ats).not.toContain("Project: Intranet & Internet App Banking");
      expect(designed).not.toContain(
        strings.cv.earlierExperience.toUpperCase(),
      );
      expect(designed).toContain("Project: Intranet & Internet App Banking");
    } finally {
      setSystemTime();
    }
  });

  test("the PDFs include every Now item and add projects", async () => {
    const content = getPopulatedContent();

    for (const mode of ["designed", "ats"] as const) {
      const text = extractText(await renderCvPdf(content, mode));
      const flat = text.replace(/\s+/g, " ");

      const repoUrl = content.personalProjects[0]?.repoUrl ?? "";
      const cleanRepoUrl = cleanUrl(repoUrl);
      expect(text).toContain(strings.projects.heading.toUpperCase());
      expect(text).toContain(content.personalProjects[0]?.name ?? "");
      if (mode === "ats") {
        expect(text).toContain(cleanRepoUrl);
      } else {
        expect(text).not.toContain(cleanRepoUrl);
        expect(text).toContain(strings.projects.repo);
        expect(text).toContain(strings.projects.live);
      }

      for (const item of content.now) {
        expect(text).toContain(item.title);
        expect(flat).toContain(item.pdfDescription);
        expect(text).toContain(`${strings.now.progress}: ${item.progress}%`);
        if (item.academyUrl) {
          const url = cleanUrl(item.academyUrl);
          if (mode === "ats") {
            expect(flat).toContain(url);
          } else {
            expect(flat).not.toContain(url);
            expect(flat).toContain(strings.now.academy);
          }
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

      if (certificate?.url) {
        if (mode === "ats") {
          expect(lines).toContain(`Validate: ${cleanUrl}`);
        } else {
          expect(lines.join("\n")).not.toContain(cleanUrl);
          expect(lines).toContain(strings.certifications.validate);
        }
      }
      if (course) expect(lines).toContain(`Progress: ${course.progress}%`);
      expect(lines.join("\n")).not.toContain("wt.mc_id");
      expect(lines.join("\n")).not.toContain("source=docs");
    }
  });

  test("designed PDF orders Projects by lastCommit and shows the date", async () => {
    const content = getContent();
    const sorted = sortProjectsByLastCommit(content.personalProjects);
    const designedBytes = await renderCvPdf(content, "designed");
    const designed = extractText(designedBytes);
    const streams = extractStreams(designedBytes);
    const ats = extractText(await renderCvPdf(content, "ats"));

    const newest = sorted[0];
    expect(newest).toBeDefined();
    const positions = sorted.map((project) => designed.indexOf(project.name));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(designed.replace(/\s+/g, " ")).toContain(
      `${strings.projects.lastCommit}: ${formatLongDate(newest?.lastCommit ?? "")}`,
    );
    expect(ats).not.toContain(`${strings.projects.lastCommit}:`);

    const repo = findTextPlacement(streams, strings.projects.repo);
    const prefix = findTextPlacement(
      streams,
      `${strings.projects.lastCommit}: `,
    );
    const value = findTextPlacement(
      streams,
      formatLongDate(newest?.lastCommit ?? ""),
    );
    expect(repo).toBeDefined();
    expect(prefix).toBeDefined();
    expect(value).toBeDefined();
    expect(repo?.y).toBe(prefix?.y);
    expect(repo?.y).toBe(value?.y);
    expect(prefix?.x ?? 0).toBeGreaterThan(repo?.x ?? 0);
    expect(value?.x ?? 0).toBeGreaterThan(prefix?.x ?? 0);
    expect(value?.font).toContain("Helvetica-Bold");
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
