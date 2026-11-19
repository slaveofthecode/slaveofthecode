import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { getContent } from "@portfolio/content";
import { renderCvPdf } from "../src/lib/cv-pdf";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
const content = getContent();

async function loadPortrait(): Promise<Uint8Array | undefined> {
  const avatar = content.profile.avatar;
  if (!avatar) return undefined;
  try {
    const response = await fetch(avatar);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return new Uint8Array(await response.arrayBuffer());
  } catch {
    return await readFile(join(publicDir, "portrait.png"));
  }
}

const portraitBytes = await loadPortrait();

for (const [mode, file] of [
  ["designed", "cv.pdf"],
  ["ats", "cv-ats.pdf"],
] as const) {
  const bytes = await renderCvPdf(content, mode, { portraitBytes });
  await writeFile(join(publicDir, file), bytes);
  console.log(`Generated ${file} (${bytes.length} bytes) from cv.json`);
}
