import { getHealth } from "../../application/get-health";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

/**
 * Web-standard request handler (Node/AWS Lambda compatible). Routes:
 *   GET /health -> 200 health payload
 *   anything else -> 404; non-GET on a known path -> 405
 */
export function handleRequest(request: Request): Response {
  const { pathname } = new URL(request.url);

  if (pathname === "/health") {
    if (request.method !== "GET") {
      return json({ error: "method_not_allowed" }, 405);
    }
    return json(getHealth(new Date()), 200);
  }

  return json({ error: "not_found" }, 404);
}
