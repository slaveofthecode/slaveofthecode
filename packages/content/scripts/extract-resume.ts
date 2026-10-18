import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import { extractText, getDocumentProxy } from "unpdf";
import { OPS } from "unpdf/pdfjs";

/**
 * Extract the resume PDF into the raw pieces the ingest step needs:
 *   - `content-source/resume.txt` (plain text) for humans/agents to review.
 *   - `apps/web/public/portrait.png` (the resume photo, if any) so the site can
 *     use it as the avatar; the file is removed when the PDF has no photo.
 *   - `apps/web/public/resume.pdf` (a byte-for-byte copy) so visitors can
 *     download the CV — this copy is intentionally committed (public repo).
 *
 * The PDF lives in the gitignored `content-source/` folder and may contain
 * personal data (phone/address). This script never prints the text or any
 * personal field — only counts — so it is safe to run in logs.
 *
 * Usage: `bun run ingest:extract` (or `bun run ingest` to extract + parse).
 */

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../../..");
const pdfPath = resolve(root, "content-source/resume.pdf");
const txtPath = resolve(root, "content-source/resume.txt");
const portraitPath = resolve(root, "apps/web/public/portrait.png");
const publicPdfPath = resolve(root, "apps/web/public/resume.pdf");

interface RawImage {
  width: number;
  height: number;
  channels: number;
  data: Uint8Array;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i += 1) {
    crc = (CRC_TABLE[(crc ^ (bytes[i] ?? 0)) & 0xff] ?? 0) ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(12 + data.length);
  const view = new DataView(out.buffer);
  view.setUint32(0, data.length);
  for (let i = 0; i < 4; i += 1) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  view.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

function encodePng(image: RawImage): Uint8Array {
  const { width, height, channels, data } = image;
  const colorType = channels === 4 ? 6 : channels === 1 ? 0 : 2;
  const stride = width * channels;
  const raw = new Uint8Array((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0;
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
  ihdr[8] = 8;
  ihdr[9] = colorType;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const chunks = [
    signature,
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", new Uint8Array(deflateSync(raw))),
    pngChunk("IEND", new Uint8Array(0)),
  ];
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const png = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    png.set(chunk, offset);
    offset += chunk.length;
  }
  return png;
}

function looksLikePhoto(image: RawImage): boolean {
  const min = Math.min(image.width, image.height);
  const ratio = image.width / image.height;
  return min >= 64 && ratio >= 0.6 && ratio <= 1.6;
}

async function extractPhoto(
  pdf: Awaited<ReturnType<typeof getDocumentProxy>>,
): Promise<RawImage | null> {
  let best: RawImage | null = null;
  for (let p = 1; p <= pdf.numPages; p += 1) {
    const page = await pdf.getPage(p);
    const ops = await page.getOperatorList();
    for (let i = 0; i < ops.fnArray.length; i += 1) {
      if (ops.fnArray[i] !== OPS.paintImageXObject) continue;
      const name = ops.argsArray[i]?.[0];
      const object = page.objs.get(name) as
        | { width: number; height: number; data: Uint8Array }
        | undefined;
      if (!object?.data) continue;
      const channels = Math.round(
        object.data.length / (object.width * object.height),
      );
      const image: RawImage = {
        width: object.width,
        height: object.height,
        channels,
        data: object.data,
      };
      if (!looksLikePhoto(image)) continue;
      if (!best || image.width * image.height > best.width * best.height) {
        best = image;
      }
    }
  }
  return best;
}

async function main(): Promise<void> {
  const pdfBytes = new Uint8Array(await readFile(pdfPath));
  const pdf = await getDocumentProxy(pdfBytes);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  await mkdir(dirname(txtPath), { recursive: true });
  await writeFile(txtPath, `${text.trim()}\n`, "utf8");

  await writeFile(publicPdfPath, pdfBytes);

  const photo = await extractPhoto(pdf);
  if (photo) {
    await writeFile(portraitPath, encodePng(photo));
  } else {
    await rm(portraitPath, { force: true });
  }

  console.log(`Extracted ${totalPages} page(s) → ${txtPath}`);
  console.log(`Characters: ${text.length}`);
  console.log(`Public copy: ${publicPdfPath}`);
  console.log(
    photo
      ? `Photo: ${photo.width}×${photo.height} → ${portraitPath}`
      : "Photo: none found (the site will use the initials circle).",
  );
  console.log(
    "Review content-source/resume.txt, then structure it into packages/content/data.",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`extract-resume failed: ${message}`);
  process.exitCode = 1;
});
