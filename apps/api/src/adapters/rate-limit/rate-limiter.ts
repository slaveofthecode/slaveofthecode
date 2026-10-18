export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult>;
}

/**
 * Simple fixed-window limiter kept in process memory. Good enough to stop casual
 * abuse for now (no external service); see docs/STATUS.md follow-ups.
 */
export class InMemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, { count: number; resetAt: number }>();

  constructor(
    private readonly maxRequests: number,
    private readonly windowSeconds: number,
    private readonly now: () => number = Date.now,
  ) {}

  async check(key: string): Promise<RateLimitResult> {
    const now = this.now();
    const windowMs = this.windowSeconds * 1000;
    const entry = this.hits.get(key);

    if (!entry || entry.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + windowMs });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        retryAfterSeconds: 0,
      };
    }

    entry.count += 1;
    const allowed = entry.count <= this.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - entry.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((entry.resetAt - now) / 1000),
    };
  }
}

function nextUtcMidnight(now: number): number {
  const date = new Date(now);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
  );
}

/**
 * Site-wide ceiling per UTC day: at most `maxRequests` successful checks between
 * one UTC midnight and the next, no matter the key. Kept in process memory (per
 * instance on serverless) — the hard spend ceiling is the Google Cloud budget;
 * see the "Chat cost caps" section in docs/architecture.md.
 */
export class InMemoryDailyLimiter implements RateLimiter {
  private count = 0;
  private resetAt = 0;

  constructor(
    private readonly maxRequests: number,
    private readonly now: () => number = Date.now,
  ) {}

  async check(_key: string): Promise<RateLimitResult> {
    const now = this.now();

    if (now >= this.resetAt) {
      this.count = 1;
      this.resetAt = nextUtcMidnight(now);
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        retryAfterSeconds: 0,
      };
    }

    this.count += 1;
    const allowed = this.count <= this.maxRequests;
    return {
      allowed,
      remaining: Math.max(0, this.maxRequests - this.count),
      retryAfterSeconds: allowed ? 0 : Math.ceil((this.resetAt - now) / 1000),
    };
  }
}
