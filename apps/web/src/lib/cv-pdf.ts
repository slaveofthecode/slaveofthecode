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
const DESIGN_HEADER_HEIGHT = 176;
const DESIGN_ACCENT = rgb(0.16, 0.16, 0.16);
const DESIGN_PANEL = rgb(0.965, 0.965, 0.965);
const DESIGN_RULE = rgb(0.82, 0.82, 0.82);
const DESIGN_MUTED = rgb(0.44, 0.44, 0.44);

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

function drawRule(ctx: Context, y: number): void {
  ctx.page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 0.6,
    color: DESIGN_RULE,
  });
}

function heading(ctx: Context, title: string): void {
  ensure(ctx, 34);
  ctx.y -= 6;
  if (ctx.mode === "designed") {
    ctx.page.drawRectangle({
      x: MARGIN,
      y: ctx.y + 1,
      width: 4,
      height: 13,
      color: DESIGN_ACCENT,
    });
    write(ctx, title.toUpperCase(), {
      bold: true,
      size: 11.5,
      indent: 12,
      gap: 3,
    });
    drawRule(ctx, ctx.y + 3);
    ctx.y -= 4;
  } else {
    write(ctx, title.toUpperCase(), { bold: true, size: 11, gap: 3 });
  }
}

function bullet(ctx: Context, value: string): void {
  write(ctx, `${ctx.mode === "ats" ? "-" : "•"} ${value}`, {
    indent: 12,
    gap: 2,
  });
}

function drawHeaderBand(ctx: Context): void {
  if (ctx.mode !== "designed") return;
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - DESIGN_HEADER_HEIGHT,
    width: PAGE_WIDTH,
    height: DESIGN_HEADER_HEIGHT,
    color: DESIGN_PANEL,
  });
  ctx.page.drawRectangle({
    x: 0,
    y: PAGE_HEIGHT - DESIGN_HEADER_HEIGHT,
    width: 6,
    height: DESIGN_HEADER_HEIGHT,
    color: DESIGN_ACCENT,
  });
}

function writeRight(ctx: Context, value: string, size = 9): void {
  const width = ctx.bold.widthOfTextAtSize(value, size);
  ctx.page.drawText(value, {
    x: PAGE_WIDTH - MARGIN - width,
    y: ctx.y - size,
    size,
    font: ctx.bold,
    color: ctx.mode === "ats" ? rgb(0, 0, 0) : DESIGN_ACCENT,
  });
}

function panelText(ctx: Context, value: string): void {
  if (ctx.mode !== "designed") {
    write(ctx, value, { gap: 8 });
    return;
  }
  const size = 10.5;
  const width = PAGE_WIDTH - MARGIN * 2 - 24;
  const lines = wrap(value, ctx.font, size, width);
  const height = lines.length * size * 1.35 + 16;
  ensure(ctx, height + 8);
  ctx.page.drawRectangle({
    x: MARGIN,
    y: ctx.y - height + 4,
    width: PAGE_WIDTH - MARGIN * 2,
    height,
    color: DESIGN_PANEL,
  });
  write(ctx, value, { indent: 8, width, gap: 8 });
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
  const ctx: Context = {
    doc,
    page: undefined as unknown as PDFPage,
    font,
    bold,
    mode,
    y: 0,
  };
  newPage(ctx);
  drawHeaderBand(ctx);

  let portrait: PDFImage | undefined;
  if (mode === "designed" && options.portraitBytes) {
    portrait = await doc.embedPng(options.portraitBytes);
  }
  const headerWidth = portrait ? PAGE_WIDTH - MARGIN * 2 - 84 : undefined;

  const { profile } = content;
  write(ctx, profile.name, {
    bold: true,
    size: mode === "ats" ? 15 : 22,
    gap: 2,
    width: headerWidth,
  });
  write(ctx, profile.headline, {
    size: mode === "ats" ? 11 : 12.5,
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
      write(ctx, `${link.label}: ${link.url}`, { width: headerWidth });
  } else {
    const contact = [profile.location, profile.email, profile.phone]
      .filter(Boolean)
      .join("  ·  ");
    write(ctx, contact, { muted: true, gap: 2, width: headerWidth });
    for (const link of profile.links) {
      write(ctx, `${link.label}: ${link.url}`, {
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
  panelText(ctx, profile.summary);

  heading(ctx, "Experience");
  for (const job of content.experience) {
    const range = formatRange(job.startDate, job.endDate, strings.cv.present);
    if (mode === "ats") {
      write(ctx, job.company, { bold: true, gap: 1 });
      write(ctx, `Dates: ${range}`, { muted: true, gap: 1 });
    } else {
      ensure(ctx, 14);
      writeRight(ctx, range, 9);
      write(ctx, job.company, {
        bold: true,
        gap: 1,
        width: PAGE_WIDTH - MARGIN * 2 - bold.widthOfTextAtSize(range, 9) - 12,
      });
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
    if (mode === "designed") {
      drawRule(ctx, ctx.y + 2);
      ctx.y -= 6;
    }
  }

  heading(ctx, "Skills");
  for (const group of content.skills) {
    if (mode === "ats") {
      write(ctx, `${group.name}: ${group.items.join(", ")}`, { gap: 4 });
    } else {
      write(ctx, `${group.name.toUpperCase()}  ${group.items.join("  ·  ")}`, {
        size: 9.5,
        gap: 5,
      });
    }
  }

  heading(ctx, "Languages");
  for (const language of content.languages) {
    write(ctx, `${language.name} — ${language.level}`, { gap: 4 });
  }

  if (content.education.length > 0) {
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

  if (content.certifications.length > 0) {
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
        write(ctx, `Validate: ${certification.url}`, { size: 9 });
      ctx.y -= 6;
    }
  }

  const courses = content.now.filter((item) => item.kind === "course");
  if (courses.length > 0) {
    heading(ctx, strings.now.heading);
    for (const item of courses) {
      write(ctx, item.title, { bold: true, gap: 1 });
      write(ctx, item.pdfDescription, { muted: true, gap: 2 });
      write(ctx, `${item.progress}%`, { muted: true, size: 9, gap: 2 });
      if (item.academyUrl)
        write(ctx, `${strings.now.academy}: ${item.academyUrl}`, { size: 9 });
      ctx.y -= 8;
    }
  }

  if (content.personalProjects.length > 0) {
    heading(ctx, strings.projects.heading);
    for (const project of content.personalProjects) {
      write(ctx, project.name, { bold: true, gap: 1 });
      if (mode === "designed" && project.tech.length > 0) {
        write(ctx, project.tech.join("  ·  "), {
          muted: true,
          size: 9,
          gap: 2,
        });
      }
      write(ctx, project.description, { muted: true, gap: 2 });
      if (mode === "ats") {
        write(ctx, `Repo: ${project.repoUrl}`, { size: 9 });
        write(ctx, `Live: ${project.productionUrl}`, { size: 9, gap: 8 });
      } else {
        write(ctx, `${strings.projects.repo}: ${project.repoUrl}`, { size: 9 });
        write(ctx, `${strings.projects.live}: ${project.productionUrl}`, {
          size: 9,
          gap: 8,
        });
        drawRule(ctx, ctx.y + 4);
        ctx.y -= 6;
      }
    }
  }

  if (mode === "designed") {
    const pages = doc.getPages();
    pages.forEach((page, index) => {
      if (index > 0) {
        page.drawText(profile.name.toUpperCase(), {
          x: MARGIN,
          y: PAGE_HEIGHT - 38,
          size: 8,
          font: bold,
          color: DESIGN_MUTED,
        });
        page.drawLine({
          start: { x: MARGIN, y: PAGE_HEIGHT - 44 },
          end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - 44 },
          thickness: 0.5,
          color: DESIGN_RULE,
        });
      }
      page.drawLine({
        start: { x: MARGIN, y: 40 },
        end: { x: PAGE_WIDTH - MARGIN, y: 40 },
        thickness: 0.5,
        color: DESIGN_RULE,
      });
      page.drawText(profile.name, {
        x: MARGIN,
        y: 27,
        size: 8,
        font,
        color: DESIGN_MUTED,
      });
      const label = `${index + 1} / ${pages.length}`;
      page.drawText(label, {
        x: PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(label, 8),
        y: 27,
        size: 8,
        font,
        color: DESIGN_MUTED,
      });
    });
  }

  return doc.save({ useObjectStreams: false });
}
