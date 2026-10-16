export interface GeminiConfig {
  apiKey: string;
  model: string;
  embedModel: string;
  baseUrl: string;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowSeconds: number;
}

export interface AppConfig {
  gemini: GeminiConfig;
  allowedOrigins: string[];
  rateLimit: RateLimitConfig;
}

const DEFAULT_GEMINI_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";
const DEFAULT_MODEL = "gemini-flash-latest";
const DEFAULT_EMBED_MODEL = "gemini-embedding-001";
const DEFAULT_ORIGINS = [
  "https://slaveofthecode.vercel.app",
  "http://localhost:4321",
];

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Reads runtime configuration from the environment (never hard-code secrets). */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const origins = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    gemini: {
      apiKey: env.GEMINI_API_KEY ?? "",
      model: env.GEMINI_MODEL || DEFAULT_MODEL,
      embedModel: env.GEMINI_EMBED_MODEL || DEFAULT_EMBED_MODEL,
      baseUrl: env.GEMINI_BASE_URL ?? DEFAULT_GEMINI_BASE_URL,
    },
    allowedOrigins: origins.length > 0 ? origins : DEFAULT_ORIGINS,
    rateLimit: {
      maxRequests: positiveInt(env.RATE_LIMIT_MAX, 20),
      windowSeconds: positiveInt(env.RATE_LIMIT_WINDOW_SECONDS, 60),
    },
  };
}
