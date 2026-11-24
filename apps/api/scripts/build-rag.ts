import { buildRagSnapshot } from "../src/adapters/rag/build-snapshot.js";

buildRagSnapshot({ empty: process.argv.includes("--empty") }).catch((error) => {
  console.error(error);
  process.exit(1);
});
