import { createServer } from "node:http";
import { handleRequest } from "./src/index";

/**
 * Minimal local dev server for the API (Node-compatible; no Bun-only APIs).
 * Run with `bun dev` (Bun loads `.env` automatically) or `node --env-file=.env`.
 */
const port = Number(process.env.PORT ?? 8787);

const server = createServer(async (req, res) => {
  const host = req.headers.host ?? `localhost:${port}`;
  const url = `http://${host}${req.url ?? "/"}`;

  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const body = chunks.length > 0 ? Buffer.concat(chunks) : undefined;

  try {
    const request = new Request(url, {
      method: req.method,
      headers: req.headers as Record<string, string>,
      body,
    });
    const response = await handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch (error) {
    res.writeHead(500, { "content-type": "application/json" });
    res.end(
      JSON.stringify({ error: "internal_error", message: String(error) }),
    );
  }
});

server.listen(port, () => {
  console.log(`@portfolio/api dev server on http://localhost:${port}`);
});
