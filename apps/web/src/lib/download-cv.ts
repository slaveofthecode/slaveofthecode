import type { CvPdfMode } from "./cv-pdf";

type PdfBuilder = (mode: CvPdfMode) => Promise<Blob>;

export function isCvPdfMode(value: string | undefined): value is CvPdfMode {
  return value === "designed" || value === "ats";
}

export function createCvPdfBlobLoader(build: PdfBuilder) {
  const pending = new Map<CvPdfMode, Promise<Blob>>();

  return (mode: CvPdfMode): Promise<Blob> => {
    const cached = pending.get(mode);
    if (cached) return cached;

    const task = build(mode).catch((error: unknown) => {
      pending.delete(mode);
      throw error;
    });
    pending.set(mode, task);
    return task;
  };
}

async function loadPortrait(avatar: string | undefined) {
  if (!avatar) return undefined;
  try {
    const response = await fetch(avatar);
    if (!response.ok) return undefined;
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return undefined;
  }
}

async function buildCvPdf(mode: CvPdfMode): Promise<Blob> {
  const [{ renderCvPdf }, { getContent }] = await Promise.all([
    import("./cv-pdf"),
    import("@portfolio/content"),
  ]);
  const content = getContent();
  const portraitBytes =
    mode === "designed"
      ? await loadPortrait(content.profile.avatar)
      : undefined;
  const bytes = await renderCvPdf(content, mode, { portraitBytes });
  return new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
}

const loadCvPdf = createCvPdfBlobLoader(buildCvPdf);
const objectUrls = new Map<CvPdfMode, string>();

function objectUrlFor(mode: CvPdfMode, blob: Blob): string {
  const cached = objectUrls.get(mode);
  if (cached) return cached;
  const url = URL.createObjectURL(blob);
  objectUrls.set(mode, url);
  return url;
}

export async function downloadCvPdf(
  mode: CvPdfMode,
  filename: string,
): Promise<void> {
  const blob = await loadCvPdf(mode);
  const link = document.createElement("a");
  link.href = objectUrlFor(mode, blob);
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
}
