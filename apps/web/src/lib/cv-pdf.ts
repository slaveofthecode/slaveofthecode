import type {
  Certification,
  Content,
  Experience,
  Link,
  NowItem,
  PersonalProject,
  SkillGroup,
} from "@portfolio/content";
import {
  PDFDocument,
  type PDFFont,
  type PDFImage,
  PDFName,
  type PDFPage,
  PDFString,
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
import { profileSummary } from "./profile-summary";
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
  italic?: boolean;
  muted?: boolean;
  indent?: number;
  gap?: number;
  width?: number;
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;
const BOTTOM = 56;
const LANGUAGE_BAR_SEGMENTS = 6;

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

function drawLanguageBar(ctx: Context, proficiencyPercent: number): void {
  const height = 4;
  const width = 120;
  const segmentWidth = width / LANGUAGE_BAR_SEGMENTS;
  const filled = Math.round((proficiencyPercent / 100) * LANGUAGE_BAR_SEGMENTS);
  ensure(ctx, height + 8);
  for (let index = 0; index < LANGUAGE_BAR_SEGMENTS; index += 1) {
    const shade = index < filled ? 0.1 : 0.8;
    ctx.page.drawRectangle({
      x: MARGIN + index * segmentWidth,
      y: ctx.y + 2,
      width: segmentWidth,
      height,
      color: rgb(shade, shade, shade),
    });
  }
  ctx.y -= height + 8;
}

function wrappedHeight(
  value: string,
  font: PDFFont,
  size: number,
  width: number,
  gap = 0,
): number {
  return wrap(value, font, size, width).length * size * 1.35 + gap;
}

function drawUnderlinedLabel(
  ctx: Context,
  label: string,
  x: number,
  size: number,
  baseline?: number,
  url?: string,
): number {
  const width = ctx.font.widthOfTextAtSize(label, size);
  const y = baseline ?? ctx.y - size;
  ctx.page.drawText(label, {
    x,
    y,
    size,
    font: ctx.font,
    color: ink(ctx, false),
  });
  ctx.page.drawLine({
    start: { x, y: y - 1.5 },
    end: { x: x + width, y: y - 1.5 },
    thickness: 0.5,
    color: ink(ctx, false),
  });
  if (url) {
    addLinkAnnotation(ctx, url, {
      x,
      y: y - 2,
      width,
      height: size + 3,
    });
  }
  return width;
}

function drawProjectLinks(
  ctx: Context,
  project: PersonalProject,
  indent: number,
  size: number,
): void {
  const links = [
    { label: strings.projects.repo, url: project.repoUrl },
    { label: strings.projects.live, url: project.productionUrl },
  ];
  const separator = "  ·  ";
  const separatorWidth = ctx.font.widthOfTextAtSize(separator, size);
  let x = MARGIN + indent;

  for (const [index, link] of links.entries()) {
    x += drawUnderlinedLabel(ctx, link.label, x, size, undefined, link.url);
    if (index < links.length - 1) {
      ctx.page.drawText(separator, {
        x,
        y: ctx.y - size,
        size,
        font: ctx.font,
        color: ink(ctx, true),
      });
      x += separatorWidth;
    }
  }
  ctx.y -= size * 1.35;
}

function drawProjectCard(ctx: Context, project: PersonalProject): void {
  const cardWidth = PAGE_WIDTH - MARGIN * 2;
  const cardPadding = 10;
  const indent = cardPadding + 8;
  const width = cardWidth - indent - cardPadding;
  const nameSize = 11;
  const descriptionSize = 9.5;
  const metaSize = 9;
  const linkSize = 9;
  const tech =
    project.tech.length > 0 ? `Tech: ${project.tech.join(", ")}` : "";
  const height =
    cardPadding * 2 +
    wrappedHeight(project.name, ctx.bold, nameSize, width, 2) +
    wrappedHeight(project.description, ctx.italic, descriptionSize, width, 3) +
    (tech ? wrappedHeight(tech, ctx.font, metaSize, width, 5) : 0) +
    linkSize * 1.35;

  ensure(ctx, height + 12);
  const top = ctx.y + 2;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - height,
    width: cardWidth,
    height,
    color: rgb(0.965, 0.965, 0.965),
    borderColor: rgb(0.86, 0.86, 0.86),
    borderWidth: 0.5,
  });
  ctx.y = top - cardPadding;

  write(ctx, project.name, {
    bold: true,
    size: nameSize,
    indent,
    width,
    gap: 2,
  });
  write(ctx, project.description, {
    italic: true,
    muted: true,
    size: descriptionSize,
    indent,
    width,
    gap: 3,
  });
  if (tech) {
    write(ctx, tech, {
      muted: true,
      size: metaSize,
      indent,
      width,
      gap: 5,
    });
  }
  drawProjectLinks(ctx, project, indent, linkSize);
  ctx.y = top - height - 10;
}

function drawProgressBar(
  ctx: Context,
  progress: number,
  indent: number,
  width: number,
  height: number,
): void {
  const x = MARGIN + indent;
  const y = ctx.y - height;
  ctx.page.drawRectangle({
    x,
    y,
    width,
    height,
    color: rgb(0.88, 0.88, 0.88),
  });
  if (progress > 0) {
    ctx.page.drawRectangle({
      x,
      y,
      width: (width * Math.min(progress, 100)) / 100,
      height,
      color: rgb(0.32, 0.32, 0.32),
    });
  }
  ctx.y -= height + 4;
}

function drawNowItem(ctx: Context, item: NowItem): void {
  const cardWidth = PAGE_WIDTH - MARGIN * 2;
  const indent = 16;
  const width = cardWidth - indent - 10;
  const titleSize = 10.5;
  const descriptionSize = 9.5;
  const linkSize = 9;
  const progressBarHeight = 3;
  const progressLabel = `${strings.now.progress}: ${item.progress}%`;
  const hasAcademy = Boolean(item.academyUrl);
  const height =
    8 +
    wrappedHeight(item.title, ctx.bold, titleSize, width, 2) +
    wrappedHeight(item.pdfDescription, ctx.italic, descriptionSize, width, 4) +
    progressBarHeight +
    4 +
    wrappedHeight(
      progressLabel,
      ctx.font,
      linkSize,
      width,
      hasAcademy ? 2 : 0,
    ) +
    (hasAcademy ? linkSize * 1.35 : 0);

  ensure(ctx, height + 8);
  const top = ctx.y + 2;
  ctx.page.drawLine({
    start: { x: MARGIN + 4, y: top },
    end: { x: MARGIN + 4, y: top - height + 4 },
    thickness: 1.2,
    color: rgb(0.75, 0.75, 0.75),
  });
  ctx.y = top - 6;

  write(ctx, item.title, {
    bold: true,
    size: titleSize,
    indent,
    width,
    gap: 2,
  });
  write(ctx, item.pdfDescription, {
    italic: true,
    muted: true,
    size: descriptionSize,
    indent,
    width,
    gap: 4,
  });
  drawProgressBar(ctx, item.progress, indent, 120, progressBarHeight);
  write(ctx, progressLabel, {
    muted: true,
    size: linkSize,
    indent,
    width,
    gap: hasAcademy ? 2 : 0,
  });
  if (item.academyUrl) {
    drawUnderlinedLabel(
      ctx,
      strings.now.academy,
      MARGIN + indent,
      linkSize,
      undefined,
      item.academyUrl,
    );
    ctx.y -= linkSize * 1.35;
  }
  ctx.y = top - height - 8;
}

function drawCertification(ctx: Context, certification: Certification): void {
  const cardWidth = PAGE_WIDTH - MARGIN * 2;
  const indent = 10;
  const nameSize = 10.5;
  const detailsSize = 9;
  const linkSize = 9;
  const validateWidth = certification.url
    ? ctx.font.widthOfTextAtSize(strings.certifications.validate, linkSize)
    : 0;
  const width =
    cardWidth - indent * 2 - (validateWidth > 0 ? validateWidth + 8 : 0);
  const nameLines = wrap(certification.name, ctx.bold, nameSize, width);
  const nameWidth = ctx.bold.widthOfTextAtSize(nameLines[0] ?? "", nameSize);
  const details = [
    certification.issuer,
    certification.date ? formatPoint(certification.date) : undefined,
  ]
    .filter(Boolean)
    .join(" · ");
  const detailsHeight = details
    ? wrappedHeight(details, ctx.italic, detailsSize, width)
    : 0;
  const detailsGap = details ? 1 : 0;
  const textHeight =
    nameLines.length * nameSize * 1.35 + detailsGap + detailsHeight;
  const height = 6 + textHeight + 8;

  ensure(ctx, height + 8);
  const top = ctx.y + 2;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - height + 2,
    width: cardWidth,
    height: 1,
    color: rgb(0.86, 0.86, 0.86),
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - 4 - textHeight / 2 - 4.5,
    width: 3,
    height: 9,
    color: rgb(0.35, 0.35, 0.35),
  });
  ctx.y = top - 4;

  write(ctx, certification.name, {
    bold: true,
    size: nameSize,
    indent,
    width,
    gap: details ? 1 : 0,
  });
  if (certification.url) {
    drawUnderlinedLabel(
      ctx,
      strings.certifications.validate,
      MARGIN + indent + nameWidth + 8,
      linkSize,
      top - 4 - nameSize,
      certification.url,
    );
  }
  if (details) {
    write(ctx, details, {
      italic: true,
      muted: true,
      size: detailsSize,
      indent,
      width,
    });
  }
  ctx.y = top - height - 8;
}

function drawExperienceCard(ctx: Context, job: Experience): void {
  const cardWidth = PAGE_WIDTH - MARGIN * 2;
  const cardPadding = 10;
  const indent = cardPadding + 8;
  const width = cardWidth - indent - cardPadding;
  const bulletIndent = indent + 10;
  const bulletWidth = width - 10;
  const headerSize = 11;
  const bodySize = 9.5;
  const techSize = 9;
  const range = formatRange(job.startDate, job.endDate, strings.cv.present);
  const header = `${job.company}  |  ${range}`;
  const roleLine = [job.role, job.location].filter(Boolean).join(" · ");
  const bulletHeight = (value: string) =>
    wrappedHeight(`• ${value}`, ctx.font, bodySize, bulletWidth, 2);
  const projectHeights = (job.projects ?? []).map((project) => {
    const headingHeight = wrappedHeight(
      project.name.trim() ? `Project: ${project.name}` : "Project",
      ctx.bold,
      bodySize,
      width,
      2,
    );
    const highlightsHeight = project.highlights.reduce(
      (sum, highlight) => sum + bulletHeight(highlight),
      0,
    );
    const techHeight =
      project.tech.length > 0
        ? wrappedHeight(
            `Tech: ${project.tech.join(", ")}`,
            ctx.font,
            techSize,
            width,
            4,
          )
        : 0;
    return headingHeight + highlightsHeight + techHeight;
  });
  const height =
    cardPadding * 2 +
    wrappedHeight(header, ctx.bold, headerSize, width, 2) +
    wrappedHeight(roleLine, ctx.italic, bodySize, width, job.summary ? 3 : 5) +
    (job.summary
      ? wrappedHeight(job.summary, ctx.italic, bodySize, width, 5)
      : 0) +
    job.highlights.reduce(
      (sum, highlight) => sum + bulletHeight(highlight),
      0,
    ) +
    projectHeights.reduce((sum, itemHeight) => sum + itemHeight + 4, 0);

  ensure(ctx, height + 12);
  const top = ctx.y + 2;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - height,
    width: cardWidth,
    height,
    color: rgb(0.965, 0.965, 0.965),
    borderColor: rgb(0.86, 0.86, 0.86),
    borderWidth: 0.5,
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - height,
    width: 3,
    height,
    color: rgb(0.35, 0.35, 0.35),
  });
  ctx.y = top - cardPadding;

  write(ctx, header, {
    bold: true,
    size: headerSize,
    indent,
    width,
    gap: 2,
  });
  write(ctx, roleLine, {
    italic: true,
    muted: true,
    size: bodySize,
    indent,
    width,
    gap: job.summary ? 3 : 5,
  });
  if (job.summary) {
    write(ctx, job.summary, {
      italic: true,
      muted: true,
      size: bodySize,
      indent,
      width,
      gap: 5,
    });
  }
  for (const highlight of job.highlights) {
    write(ctx, `• ${highlight}`, {
      size: bodySize,
      indent: bulletIndent,
      width: bulletWidth,
      gap: 2,
    });
  }
  for (const project of job.projects ?? []) {
    write(ctx, project.name.trim() ? `Project: ${project.name}` : "Project", {
      bold: true,
      size: bodySize,
      indent,
      width,
      gap: 2,
    });
    for (const highlight of project.highlights) {
      write(ctx, `• ${highlight}`, {
        size: bodySize,
        indent: bulletIndent,
        width: bulletWidth,
        gap: 2,
      });
    }
    if (project.tech.length > 0) {
      write(ctx, `Tech: ${project.tech.join(", ")}`, {
        muted: true,
        size: techSize,
        indent,
        width,
        gap: 4,
      });
    }
    ctx.y -= 4;
  }
  ctx.y = top - height - 10;
}

function drawSkillsTable(ctx: Context, groups: SkillGroup[]): void {
  const tableWidth = PAGE_WIDTH - MARGIN * 2;
  const categoryWidth = tableWidth / 3;
  const techWidth = tableWidth - categoryWidth;
  const padding = 10;
  const rowPadding = 7;
  const headerHeight = 20;
  const headerSize = 8.5;
  const cellSize = 9;
  const lineHeight = cellSize * 1.35;
  const categoryX = MARGIN + categoryWidth - padding;
  const techX = MARGIN + categoryWidth + padding;
  const categoryTextWidth = categoryWidth - padding * 2;
  const techTextWidth = techWidth - padding * 2;
  const headerCenterY = headerHeight / 2;
  const headerBaseline = headerCenterY + headerSize * 0.35;
  const rows = groups.map((group) => {
    const categoryLines = wrap(
      group.name,
      ctx.code,
      cellSize,
      categoryTextWidth,
    );
    const techLines = wrap(
      group.items.join(", "),
      ctx.code,
      cellSize,
      techTextWidth,
    );
    return {
      categoryLines,
      techLines,
      height:
        Math.max(categoryLines.length, techLines.length) * lineHeight +
        rowPadding * 2,
    };
  });
  const height = headerHeight + rows.reduce((sum, row) => sum + row.height, 0);

  ensure(ctx, height + 8);
  const top = ctx.y + 2;
  const bottom = top - height;
  ctx.page.drawRectangle({
    x: MARGIN,
    y: bottom,
    width: tableWidth,
    height,
    color: rgb(0.965, 0.965, 0.965),
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: top - headerHeight,
    width: tableWidth,
    height: headerHeight,
    color: rgb(0.94, 0.94, 0.94),
  });
  ctx.page.drawRectangle({
    x: MARGIN,
    y: bottom,
    width: tableWidth,
    height,
    borderColor: rgb(0.86, 0.86, 0.86),
    borderWidth: 0.5,
  });
  ctx.page.drawLine({
    start: { x: MARGIN, y: top - headerHeight },
    end: { x: MARGIN + tableWidth, y: top - headerHeight },
    thickness: 0.6,
    color: rgb(0.75, 0.75, 0.75),
  });

  const categoryHeader = strings.skills.category.toUpperCase();
  const techHeader = strings.skills.technologies.toUpperCase();
  ctx.page.drawText(categoryHeader, {
    x: categoryX - ctx.bold.widthOfTextAtSize(categoryHeader, headerSize),
    y: top - headerBaseline,
    size: headerSize,
    font: ctx.bold,
    color: ink(ctx, true),
  });
  ctx.page.drawText(techHeader, {
    x: techX,
    y: top - headerBaseline,
    size: headerSize,
    font: ctx.bold,
    color: ink(ctx, true),
  });

  let rowTop = top - headerHeight;
  rows.forEach((row, index) => {
    if (index > 0) {
      ctx.page.drawLine({
        start: { x: MARGIN, y: rowTop },
        end: { x: MARGIN + tableWidth, y: rowTop },
        thickness: 0.5,
        color: rgb(0.86, 0.86, 0.86),
      });
    }
    const baseline = rowTop - rowPadding - cellSize;
    row.categoryLines.forEach((line, lineIndex) => {
      ctx.page.drawText(line, {
        x: categoryX - ctx.code.widthOfTextAtSize(line, cellSize),
        y: baseline - lineIndex * lineHeight,
        size: cellSize,
        font: ctx.code,
        color: ink(ctx, false),
      });
    });
    row.techLines.forEach((line, lineIndex) => {
      ctx.page.drawText(line, {
        x: techX,
        y: baseline - lineIndex * lineHeight,
        size: cellSize,
        font: ctx.code,
        color: ink(ctx, true),
      });
    });
    rowTop -= row.height;
  });
  ctx.y = bottom - 10;
}

function write(ctx: Context, value: string, options: WriteOptions = {}): void {
  const size = options.size ?? (ctx.mode === "ats" ? 10 : 10.5);
  const font = options.bold ? ctx.bold : options.italic ? ctx.italic : ctx.font;
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

function addLinkAnnotation(
  ctx: Context,
  url: string,
  rect: { x: number; y: number; width: number; height: number },
): void {
  const { context } = ctx.doc;
  const action = context.obj({
    S: PDFName.of("URI"),
    URI: PDFString.of(url),
  });
  const annotation = context.obj({
    Type: PDFName.of("Annot"),
    Subtype: PDFName.of("Link"),
    Rect: [rect.x, rect.y, rect.x + rect.width, rect.y + rect.height],
    Border: [0, 0, 0],
    A: action,
  });
  ctx.page.node.addAnnot(context.register(annotation));
}

function writeInlineLinks(
  ctx: Context,
  links: Link[],
  options: WriteOptions = {},
): void {
  if (links.length === 0) return;
  const size = options.size ?? 9;
  const width = options.width ?? PAGE_WIDTH - MARGIN * 2;
  const lineHeight = size * 1.35;
  const separator = "  ·  ";
  const separatorWidth = ctx.font.widthOfTextAtSize(separator, size);
  const color = ink(ctx, Boolean(options.muted));
  let x = MARGIN;

  for (const link of links) {
    const labelWidth = ctx.font.widthOfTextAtSize(link.label, size);
    const needsSeparator = x > MARGIN;
    const nextWidth = labelWidth + (needsSeparator ? separatorWidth : 0);
    if (x + nextWidth > MARGIN + width && x > MARGIN) {
      ctx.y -= lineHeight;
      x = MARGIN;
    }
    ensure(ctx, lineHeight);
    const baseline = ctx.y - size;
    if (x > MARGIN) {
      ctx.page.drawText(separator, {
        x,
        y: baseline,
        size,
        font: ctx.font,
        color,
      });
      x += separatorWidth;
    }
    ctx.page.drawText(link.label, {
      x,
      y: baseline,
      size,
      font: ctx.font,
      color,
    });
    ctx.page.drawLine({
      start: { x, y: baseline - 1.5 },
      end: { x: x + labelWidth, y: baseline - 1.5 },
      thickness: 0.5,
      color,
    });
    addLinkAnnotation(ctx, link.url, {
      x,
      y: baseline - 2,
      width: labelWidth,
      height: size + 3,
    });
    x += labelWidth;
  }
  ctx.y -= lineHeight + (options.gap ?? 0);
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
  const sectionGap = ctx.mode === "ats" ? 6 : 9;
  ensure(ctx, 34);
  ctx.y -= sectionGap;
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
    ctx.y -= sectionGap;
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
    writeInlineLinks(ctx, profile.links, {
      muted: true,
      size: 9,
      width: headerWidth,
      gap: 2,
    });
  }
  ctx.y -= ctx.mode === "ats" ? 6 : 9;

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
  writeMarkdown(ctx, profileSummary(profile), { gap: 8 });

  if (hasCvSection(content, "experience")) {
    heading(ctx, "Experience");
    for (const job of content.experience) {
      if (mode === "ats") {
        const range = formatRange(
          job.startDate,
          job.endDate,
          strings.cv.present,
        );
        write(ctx, job.company, { bold: true, gap: 1 });
        write(ctx, `Dates: ${range}`, { muted: true, gap: 1 });
        write(ctx, [job.role, job.location].filter(Boolean).join(" · "), {
          gap: 3,
        });
        if (job.summary) write(ctx, job.summary, { muted: true, gap: 3 });
        for (const highlight of job.highlights) bullet(ctx, highlight);
        for (const project of job.projects ?? []) {
          write(
            ctx,
            project.name.trim() ? `Project: ${project.name}` : "Project",
            { bold: true, gap: 2 },
          );
          for (const highlight of project.highlights) bullet(ctx, highlight);
          if (project.tech.length > 0) {
            write(ctx, `Tech: ${project.tech.join(", ")}`, {
              muted: true,
              size: 9,
              gap: 6,
            });
          }
        }
      } else {
        drawExperienceCard(ctx, job);
      }
    }
  }

  if (hasCvSection(content, "skills")) {
    heading(ctx, "Skills");
    if (ctx.mode === "designed") {
      drawSkillsTable(ctx, content.skills);
    } else {
      for (const group of content.skills) {
        write(ctx, `${group.name}: ${group.items.join(", ")}`, { gap: 4 });
      }
    }
  }

  if (hasCvSection(content, "languages")) {
    heading(ctx, "Languages");
    for (const language of content.languages) {
      write(ctx, `${language.name} — ${language.level}`, { gap: 4 });
      if (ctx.mode === "designed") {
        drawLanguageBar(ctx, language.proficiencyPercent);
      }
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
      if (mode === "ats") {
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
      } else {
        drawCertification(ctx, certification);
      }
    }
  }

  if (hasCvSection(content, "now")) {
    heading(ctx, strings.now.heading);
    for (const item of content.now) {
      if (mode === "ats") {
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
      } else {
        drawNowItem(ctx, item);
      }
    }
  }

  if (hasCvSection(content, "projects")) {
    heading(ctx, strings.projects.heading);
    for (const project of content.personalProjects) {
      if (mode === "ats") {
        write(ctx, project.name, { bold: true, gap: 1 });
        write(ctx, project.description, { muted: true, gap: 2 });
        writeUnwrapped(ctx, `Repo: ${pdfUrl(project.repoUrl)}`, { size: 9 });
        writeUnwrapped(ctx, `Live: ${pdfUrl(project.productionUrl)}`, {
          size: 9,
          gap: 8,
        });
      } else {
        drawProjectCard(ctx, project);
      }
    }
  }

  return doc.save({ useObjectStreams: false });
}
