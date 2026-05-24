import "server-only";

/**
 * Bucket-based rate limiter.
 *
 * **In-memory implementation** — fine for a single-instance dev/staging server,
 * NOT suitable for multi-instance production. Before public launch swap the
 * `store` adapter for Upstash Redis / Vercel KV (interface preserved).
 */

type Bucket = { remaining: number; resetAt: number };

const store = new Map<string, Bucket>();

function pruneIfLarge() {
  if (store.size < 5_000) return;
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.resetAt < now) store.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

export function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowSeconds: number;
}): RateLimitResult {
  const { key, limit, windowSeconds } = opts;
  const now = Date.now();
  pruneIfLarge();

  let bucket = store.get(key);
  if (!bucket || bucket.resetAt < now) {
    bucket = { remaining: limit, resetAt: now + windowSeconds * 1000 };
  }

  if (bucket.remaining <= 0) {
    store.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.remaining -= 1;
  store.set(key, bucket);
  return {
    ok: true,
    remaining: bucket.remaining,
    resetAt: bucket.resetAt,
    retryAfterSeconds: 0,
  };
}

export function clientKeyFromRequest(req: Request, scope: string): string {
  // Prefer Vercel's forwarded chain, fall back to a single header.
  const xff = req.headers.get("x-forwarded-for") ?? "";
  const ip = xff.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: "rate_limited",
      retry_after_seconds: result.retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
      },
    },
  );
}
