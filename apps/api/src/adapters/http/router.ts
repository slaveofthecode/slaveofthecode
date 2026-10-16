import { answerQuestion } from "../../application/answer-question";
import { getHealth } from "../../application/get-health";
import { loadConfig } from "../../config";
import { chatRequestSchema } from "../../domain/chat";
import type { EmbeddingProvider } from "../../domain/embedding-provider";
import type { LlmProvider } from "../../domain/llm-provider";
import type { RagStore } from "../../domain/rag";
import { GeminiEmbeddings } from "../llm/gemini-embeddings";
import { GeminiError, GeminiProvider } from "../llm/gemini-provider";
import { SqliteRagStore } from "../rag/sqlite-store";
import {
  InMemoryRateLimiter,
  type RateLimiter,
} from "../rate-limit/rate-limiter";

export interface HandlerDeps {
  provider: LlmProvider;
  embeddings: EmbeddingProvider;
  store: RagStore;
  rateLimiter: RateLimiter;
  allowedOrigins: string[];
  maxOutputTokens?: number;
  retrieveK?: number;
}

const MAX_BODY_BYTES = 16_384;

function corsHeaders(
  origin: string | null,
  allowedOrigins: string[],
): Record<string, string> {
  if (!origin || !allowedOrigins.includes(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-max-age": "86400",
    vary: "origin",
  };
}

function json(
  body: unknown,
  status: number,
  headers: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", ...headers },
  });
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * Web-standard request handler (Node/AWS Lambda/Vercel compatible). Routes:
 *   GET  /health -> 200 health payload
 *   POST /chat   -> 200 { reply } grounded on the CV via RAG (ADR-0006)
 *   anything else -> 404; wrong method on a known path -> 405
 *
 * On Vercel the functions live under `/api` (e.g. `/api/chat`), so a leading
 * `/api` segment is stripped before routing.
 */
export function createHandler(
  deps: HandlerDeps,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const { pathname: raw } = new URL(request.url);
    const pathname = raw.replace(/^\/api(?=\/|$)/, "") || "/";
    const origin = request.headers.get("origin");
    const cors = corsHeaders(origin, deps.allowedOrigins);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }

    if (pathname === "/health") {
      if (request.method !== "GET") {
        return json({ error: "method_not_allowed" }, 405, cors);
      }
      return json(getHealth(new Date()), 200, cors);
    }

    if (pathname === "/chat") {
      if (request.method !== "POST") {
        return json({ error: "method_not_allowed" }, 405, cors);
      }
      if (origin && !deps.allowedOrigins.includes(origin)) {
        return json({ error: "forbidden_origin" }, 403, {});
      }

      const contentLength = Number(
        request.headers.get("content-length") ?? "0",
      );
      if (contentLength > MAX_BODY_BYTES) {
        return json({ error: "payload_too_large" }, 413, cors);
      }

      let raw: unknown;
      try {
        raw = await request.json();
      } catch {
        return json({ error: "invalid_json" }, 400, cors);
      }

      const parsed = chatRequestSchema.safeParse(raw);
      if (!parsed.success) {
        return json(
          {
            error: "invalid_request",
            issues: parsed.error.issues.map(
              (issue) => issue.path.join(".") || "(root)",
            ),
          },
          400,
          cors,
        );
      }

      const limit = await deps.rateLimiter.check(clientIp(request));
      if (!limit.allowed) {
        return json({ error: "rate_limited" }, 429, {
          ...cors,
          "retry-after": String(limit.retryAfterSeconds),
        });
      }

      try {
        const reply = await answerQuestion(
          {
            messages: parsed.data.messages,
            locale: parsed.data.locale,
            signal: request.signal,
          },
          {
            store: deps.store,
            embeddings: deps.embeddings,
            provider: deps.provider,
            maxOutputTokens: deps.maxOutputTokens,
            retrieveK: deps.retrieveK,
          },
        );
        return json({ reply }, 200, cors);
      } catch (error) {
        if (error instanceof GeminiError) {
          return json({ error: "upstream_error" }, 502, cors);
        }
        return json({ error: "internal_error" }, 500, cors);
      }
    }

    return json({ error: "not_found" }, 404, cors);
  };
}

let defaultHandler:
  | Promise<(request: Request) => Promise<Response>>
  | undefined;

async function initDefaultHandler(): Promise<
  (request: Request) => Promise<Response>
> {
  const config = loadConfig();
  const store = await SqliteRagStore.open();
  return createHandler({
    provider: new GeminiProvider(config.gemini),
    embeddings: new GeminiEmbeddings(config.gemini),
    store,
    rateLimiter: new InMemoryRateLimiter(
      config.rateLimit.maxRequests,
      config.rateLimit.windowSeconds,
    ),
    allowedOrigins: config.allowedOrigins,
  });
}

/** Default entry point used in production (reads config from the environment). */
export async function handleRequest(request: Request): Promise<Response> {
  defaultHandler ??= initDefaultHandler();
  const handler = await defaultHandler;
  return handler(request);
}
