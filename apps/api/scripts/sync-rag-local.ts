import { syncRagForLocalDev } from "../src/adapters/rag/local-sync.js";

syncRagForLocalDev().catch((error) => {
  console.error(error);
  process.exit(1);
});
