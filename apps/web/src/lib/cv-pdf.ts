import type { Content } from "@portfolio/content";
import {
  PDFDocument,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { formatPoint, formatRange } from "./dates";
import {
  type MarkdownRun,
  type MarkdownStyle,
  parseMarkdownBlocks,
} from "./markdown";
import { hasCvSection } from "./sections";
import { strings } from "./strings";

export type CvPdfMode = "designed" | "ats";

export interface CvPdfOptions {
  portraitBytes?: Uint8Array;
}

interface Context {
  doc: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  code: PDFFont;
  mode: CvPdfMode;
  y: number;
}

interface WriteOptions {
  size?: number;
  bold?: boolean;
  muted?: boolean;
  indent?: number;
  gap?: number;
  width?: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const BOTTOM = 56;

function newPage(ctx: Context): void {
  ctx.page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.y = PAGE_HEIGHT - MARGIN;
}

function ensure(ctx: Context, height: number): void {
  if (ctx.y - height < BOTTOM) newPage(ctx);
}

function wrap(
  text: string,
  font: PDFFont,
  size: number,
  width: number,
): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= width) {
      line = candidate;
      continue;
    }
    if (line) lines.push(line);
    line = word;
    while (font.widthOfTextAtSize(line, size) > width) {
      let cut = line.length - 1;
      while (
        cut > 1 &&
        font.widthOfTextAtSize(line.slice(0, cut), size) > width
      ) {
        cut -= 1;
      }
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines.length > 0 ? lines : [""];
}

function ink(ctx: Context, muted: boolean): RGB {
  if (ctx.mode === "ats") return rgb(0, 0, 0);
  const level = muted ? 0.42 : 0.1;
  return rgb(level, level, level);
}

function write(ctx: Context, value: string, options: WriteOptions = {}): void {
  const size = options.size ?? (ctx.mode === "ats" ? 10 : 10.5);
  const font = options.bold ? ctx.bold : ctx.font;
  const indent = options.indent ?? 0;
  const lineHeight = size * 1.35;
  const width = options.width ?? PAGE_WIDTH - MARGIN * 2 - indent;
  const lines = wrap(value, font, size, width);

  for (const line of lines) {
    ensure(ctx, lineHeight);
    ctx.page.drawText(line, {
      x: MARGIN + indent,
      y: ctx.y - size,
      size,
      font,
      color: ink(ctx, Boolean(options.muted)),
    });
    ctx.y -= lineHeight;
  }
  ctx.y -= options.gap ?? 0;
}

function fontFor(ctx: Context, style: MarkdownStyle): PDFFont {
  switch (style) {
    case "bold":
      return ctx.bold;
    case "italic":
      return ctx.italic;
    case "code":
      return ctx.code;
    default:
      return ctx.font;
  }
}

interface PlacedRun {
  text: string;
  font: PDFFont;
  width: number;
}

function drawRuns(
  ctx: Context,
  runs: MarkdownRun[],
  options: WriteOptions = {},
): void {
  const size = options.size ?? (ctx.mode === "ats" ? 10 : 10.5);
  const indent = options.indent ?? 0;
  const width = options.width ?? PAGE_WIDTH - MARGIN * 2 - indent;
  const lineHeight = size * 1.35;
  const startX = MARGIN + indent;
  let line: PlacedRun[] = [];
  let lineWidth = 0;

  const flush = (): void => {
    if (line.length === 0) return;
    ensure(ctx, lineHeight);
    let x = startX;
    for (const part of line) {
      ctx.page.drawText(part.text, {
        x,
        y: ctx.y - size,
        size,
        font: part.font,
        color: ink(ctx, Boolean(options.muted)),
      });
      x += part.width;
    }
    ctx.y -= lineHeight;
    line = [];
    lineWidth = 0;
  };

  for (const run of runs) {
    const font = fontFor(ctx, run.style);
    for (const token of run.text.split(/(\s+)/).filter(Boolean)) {
      const tokenWidth = font.widthOfTextAtSize(token, size);
      if (/^\s+$/.test(token)) {
        const last = line.at(-1);
        if (last) {
          last.text += token;
          last.width += tokenWidth;
          lineWidth += tokenWidth;
        }
        continue;
      }
      if (lineWidth > 0 && lineWidth + tokenWidth > width) flush();
      line.push({ text: token, font, width: tokenWidth });
      lineWidth += tokenWidth;
    }
  }

  flush();
}

function writeMarkdown(
  ctx: Context,
  value: string,
  options: WriteOptions = {},
): void {
  const { gap = 0, ...lineOptions } = options;
  const listIndent = (options.indent ?? 0) + 12;

  for (const block of parseMarkdownBlocks(value)) {
    if (block.kind === "blank") {
      ctx.y -= 6;
      continue;
    }

    if (block.kind === "text") {
      drawRuns(ctx, block.runs, { ...lineOptions, gap: 0 });
      continue;
    }

    const prefix =
      block.kind === "ordered"
        ? `${block.marker} `
        : `${ctx.mode === "ats" ? "-" : "•"} `;
    drawRuns(ctx, [{ text: prefix, style: "text" }, ...block.runs], {
      ...lineOptions,
      indent: listIndent + block.indent,
      gap: 2,
    });
  }

  ctx.y -= gap;
}

function pdfUrl(value: string): string {
  const query = value.indexOf("?");
  const hash = value.indexOf("#");
  const end = Math.min(
    query === -1 ? value.length : query,
    hash === -1 ? value.length : hash,
  );
  return value.slice(0, end);
}

function writeUnwrapped(
  ctx: Context,
  value: string,
  options: WriteOptions = {},
): void {
  const indent = options.indent ?? 0;
  const width = options.width ?? PAGE_WIDTH - MARGIN * 2 - indent;
  const font = options.bold ? ctx.bold : ctx.font;
  let size = options.size ?? (ctx.mode === "ats" ? 10 : 10.5);
  while (font.widthOfTextAtSize(value, size) > width && size > 5) {
    size -= 0.5;
  }
  const lineHeight = size * 1.35;
  ensure(ctx, lineHeight);
  ctx.page.drawText(value, {
    x: MARGIN + indent,
    y: ctx.y - size,
    size,
    font,
    color: ink(ctx, Boolean(options.muted)),
  });
  ctx.y -= lineHeight;
  ctx.y -= options.gap ?? 0;
}

function heading(ctx: Context, title: string): void {
  ensure(ctx, 34);
  ctx.y -= 6;
  write(ctx, title.toUpperCase(), {
    bold: true,
    size: ctx.mode === "ats" ? 11 : 11.5,
    gap: 3,
  });
  if (ctx.mode === "designed") {
    ctx.page.drawLine({
      start: { x: MARGIN, y: ctx.y + 2 },
      end: { x: PAGE_WIDTH - MARGIN, y: ctx.y + 2 },
      thickness: 0.6,
      color: rgb(0.75, 0.75, 0.75),
    });
    ctx.y -= 6;
  }
}

function bullet(ctx: Context, value: string): void {
  write(ctx, `${ctx.mode === "ats" ? "-" : "•"} ${value}`, {
    indent: 12,
    gap: 2,
  });
}

/** Render every CV fact from the content package into one PDF. */
export async function renderCvPdf(
  content: Content,
  mode: CvPdfMode,
  options: CvPdfOptions = {},
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique);
  const code = await doc.embedFont(StandardFonts.Courier);
  const ctx: Context = {
    doc,
    page: undefined as unknown as PDFPage,
    font,
    bold,
    italic,
    code,
    mode,
    y: 0,
  };
  newPage(ctx);

  let portrait: PDFImage | undefined;
  if (mode === "designed" && options.portraitBytes) {
    portrait = await doc.embedPng(options.portraitBytes);
  }
  const headerWidth = portrait ? PAGE_WIDTH - MARGIN * 2 - 84 : undefined;

  const { profile } = content;
  write(ctx, profile.name, {
    bold: true,
    size: mode === "ats" ? 15 : 20,
    gap: 2,
    width: headerWidth,
  });
  write(ctx, profile.headline, {
    size: mode === "ats" ? 11 : 12,
    muted: true,
    gap: 6,
    width: headerWidth,
  });

  if (mode === "ats") {
    write(ctx, `Location: ${profile.location}`, { width: headerWidth });
    if (profile.email)
      write(ctx, `Email: ${profile.email}`, { width: headerWidth });
    if (profile.phone)
      write(ctx, `Phone: ${profile.phone}`, { width: headerWidth });
    for (const link of profile.links)
      writeUnwrapped(ctx, `${link.label}: ${pdfUrl(link.url)}`, {
        width: headerWidth,
      });
  } else {
    const contact = [profile.location, profile.email, profile.phone]
      .filter(Boolean)
      .join("  ·  ");
    write(ctx, contact, { muted: true, gap: 2, width: headerWidth });
    for (const link of profile.links) {
      writeUnwrapped(ctx, `${link.label}: ${pdfUrl(link.url)}`, {
        muted: true,
        size: 9,
        width: headerWidth,
      });
    }
  }
  ctx.y -= 6;

  if (portrait) {
    const size = 72;
    ctx.page.drawImage(portrait, {
      x: PAGE_WIDTH - MARGIN - size,
      y: PAGE_HEIGHT - MARGIN - size,
      width: size,
      height: size,
    });
  }

  heading(ctx, "Summary");
  writeMarkdown(ctx, profile.summary, { gap: 8 });

  if (hasCvSection(content, "experience")) {
    heading(ctx, "Experience");
    for (const job of content.experience) {
      const range = formatRange(job.startDate, job.endDate, strings.cv.present);
      if (mode === "ats") {
        write(ctx, job.company, { bold: true, gap: 1 });
        write(ctx, `Dates: ${range}`, { muted: true, gap: 1 });
      } else {
        write(ctx, `${job.company}  |  ${range}`, { bold: true, gap: 1 });
      }
      write(ctx, [job.role, job.location].filter(Boolean).join(" · "), {
        gap: 3,
      });
      if (job.summary) write(ctx, job.summary, { muted: true, gap: 3 });
      for (const highlight of job.highlights) bullet(ctx, highlight);
      for (const project of job.projects ?? []) {
        write(ctx, `Project: ${project.name}`, { bold: true, gap: 2 });
        for (const highlight of project.highlights) bullet(ctx, highlight);
      }
      if (job.tech.length > 0) {
        write(ctx, `Tech: ${job.tech.join(", ")}`, {
          muted: true,
          size: 9,
          gap: 10,
        });
      } else {
        ctx.y -= 10;
      }
    }
  }

  if (hasCvSection(content, "skills")) {
    heading(ctx, "Skills");
    for (const group of content.skills) {
      write(ctx, `${group.name}: ${group.items.join(", ")}`, { gap: 4 });
    }
  }

  if (hasCvSection(content, "languages")) {
    heading(ctx, "Languages");
    for (const language of content.languages) {
      write(ctx, `${language.name} — ${language.level}`, { gap: 4 });
    }
  }

  if (hasCvSection(content, "education")) {
    heading(ctx, "Education");
    for (const entry of content.education) {
      const range = formatRange(
        entry.startDate,
        entry.endDate,
        strings.cv.present,
      );
      write(
        ctx,
        mode === "ats"
          ? entry.institution
          : `${entry.institution}  |  ${range}`,
        { bold: true, gap: 1 },
      );
      if (mode === "ats") write(ctx, `Dates: ${range}`, { muted: true });
      write(ctx, entry.title, { muted: true, gap: 8 });
    }
  }

  if (hasCvSection(content, "certifications")) {
    heading(ctx, "Certifications");
    for (const certification of content.certifications) {
      write(ctx, certification.name, { bold: true, gap: 1 });
      const details = [
        certification.issuer,
        certification.date ? formatPoint(certification.date) : undefined,
      ]
        .filter(Boolean)
        .join(" · ");
      if (details) write(ctx, details, { muted: true });
      if (certification.url)
        writeUnwrapped(ctx, `Validate: ${pdfUrl(certification.url)}`, {
          size: 9,
        });
      ctx.y -= 6;
    }
  }

  if (hasCvSection(content, "now")) {
    heading(ctx, strings.now.heading);
    for (const item of content.now) {
      write(ctx, item.title, { bold: true, gap: 1 });
      write(ctx, item.pdfDescription, { muted: true, gap: 2 });
      write(ctx, `${strings.now.progress}: ${item.progress}%`, {
        muted: true,
        size: 9,
        gap: 2,
      });
      if (item.academyUrl)
        writeUnwrapped(
          ctx,
          `${strings.now.academy}: ${pdfUrl(item.academyUrl)}`,
          { size: 9 },
        );
      ctx.y -= 8;
    }
  }

  if (hasCvSection(content, "projects")) {
    heading(ctx, strings.projects.heading);
    for (const project of content.personalProjects) {
      write(ctx, project.name, { bold: true, gap: 1 });
      write(ctx, project.description, { muted: true, gap: 2 });
      writeUnwrapped(ctx, `Repo: ${pdfUrl(project.repoUrl)}`, { size: 9 });
      writeUnwrapped(ctx, `Live: ${pdfUrl(project.productionUrl)}`, {
        size: 9,
        gap: 8,
      });
    }
  }

  return doc.save({ useObjectStreams: false });
}
