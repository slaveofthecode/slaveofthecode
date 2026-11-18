import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getContent } from "@portfolio/content";
import { renderCvPdf } from "../src/lib/cv-pdf";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const content = getContent();

for (const [mode, file] of [
  ["designed", "cv.pdf"],
  ["ats", "cv-ats.pdf"],
] as const) {
  const bytes = await renderCvPdf(content, mode);
  await writeFile(join(publicDir, file), bytes);
  console.log(`Generated ${file} (${bytes.length} bytes) from cv.json`);
}
