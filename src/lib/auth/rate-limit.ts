/**
 * محدودسازی نرخ ورود (Login Rate Limiting) — حافظهٔ درون‌پردازشی
 * برای چند نمونه‌ای بودن (serverless) می‌توان این لایه را با Redis جایگزین کرد.
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // ۱۵ دقیقه
const MAX_ATTEMPTS = 10;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

export function checkRateLimit(key: string, max = MAX_ATTEMPTS, windowMs = WINDOW_MS): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
  }
  if (bucket.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(bucket.resetAt - now, 0),
    };
  }
  bucket.count++;
  return { allowed: true, remaining: max - bucket.count, retryAfterMs: 0 };
}

export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** پاکسازی باکت‌های منقضی (جلوگیری از نشت حافظه) */
export function pruneRateLimits(): void {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}
