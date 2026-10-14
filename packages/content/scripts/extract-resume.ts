import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { extractText, getDocumentProxy } from "unpdf";

/**
 * Extract the resume PDF to plain text for the ingest step.
 *
 * The PDF lives in the gitignored `content-source/` folder and may contain
 * personal data (phone/address). This script never prints the extracted text
 * or any personal field — only counts — so it is safe to run in logs.
 *
 * Usage: `bun run ingest:extract`
 */

const here = dirname(fileURLToPath(import.meta.url));
const pdfPath = resolve(here, "../../../content-source/resume.pdf");
const txtPath = resolve(here, "../../../content-source/resume.txt");

async function main(): Promise<void> {
  const pdfBytes = new Uint8Array(await readFile(pdfPath));
  const pdf = await getDocumentProxy(pdfBytes);
  const { totalPages, text } = await extractText(pdf, { mergePages: true });

  await mkdir(dirname(txtPath), { recursive: true });
  await writeFile(txtPath, `${text.trim()}\n`, "utf8");

  console.log(`Extracted ${totalPages} page(s) → ${txtPath}`);
  console.log(`Characters: ${text.length}`);
  console.log(
    "Review content-source/resume.txt, then structure it into packages/content/data.",
  );
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`extract-resume failed: ${message}`);
  process.exitCode = 1;
});
