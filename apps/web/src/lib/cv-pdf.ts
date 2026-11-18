import type { Content } from "@portfolio/content";
import {
  PDFDocument,
  type PDFFont,
  type PDFPage,
  type RGB,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { formatPoint, formatRange } from "./dates";
import { strings } from "./strings";

export type CvPdfMode = "designed" | "ats";

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
  const lines = wrap(value, font, size, PAGE_WIDTH - MARGIN * 2 - indent);

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

  const { profile } = content;
  write(ctx, profile.name, {
    bold: true,
    size: mode === "ats" ? 15 : 20,
    gap: 2,
  });
  write(ctx, profile.headline, {
    size: mode === "ats" ? 11 : 12,
    muted: true,
    gap: 6,
  });

  if (mode === "ats") {
    write(ctx, `Location: ${profile.location}`);
    if (profile.email) write(ctx, `Email: ${profile.email}`);
    if (profile.phone) write(ctx, `Phone: ${profile.phone}`);
    for (const link of profile.links) write(ctx, `${link.label}: ${link.url}`);
  } else {
    const contact = [profile.location, profile.email, profile.phone]
      .filter(Boolean)
      .join("  ·  ");
    write(ctx, contact, { muted: true, gap: 2 });
    for (const link of profile.links) {
      write(ctx, `${link.label}: ${link.url}`, { muted: true, size: 9 });
    }
  }
  ctx.y -= 6;

  heading(ctx, "Summary");
  write(ctx, profile.summary, { gap: 8 });

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

  heading(ctx, "Skills");
  for (const group of content.skills) {
    write(ctx, `${group.name}: ${group.items.join(", ")}`, { gap: 4 });
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

  if (content.now.length > 0) {
    heading(ctx, strings.now.heading);
    for (const item of content.now) {
      write(
        ctx,
        `${item.title} (${strings.now.kind[item.kind]} · ${strings.now.status[item.status]} · ${item.progress}%)`,
        { bold: true, gap: 1 },
      );
      write(ctx, item.description, { muted: true, gap: 2 });
      if (item.tags.length > 0) {
        write(ctx, `Tags: ${item.tags.join(", ")}`, { size: 9, muted: true });
      }
      for (const link of item.links)
        write(ctx, `${link.label}: ${link.url}`, { size: 9 });
      write(
        ctx,
        `${strings.now.updated}: ${formatPoint(item.updatedAt.slice(0, 7))}`,
        { muted: true, size: 9, gap: 8 },
      );
    }
  }

  return doc.save({ useObjectStreams: false });
}
