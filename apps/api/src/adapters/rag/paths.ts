import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const CV_PATH = join(
  here,
  "..",
  "..",
  "..",
  "..",
  "..",
  "packages",
  "content",
  "data",
  "cv.json",
);
export const SNAPSHOT_PATH = join(here, "..", "..", "..", "data", "cv.sqlite");
export const RAG_DB_MODULE_PATH = join(
  here,
  "..",
  "..",
  "..",
  "src",
  "data",
  "rag-db.ts",
);
