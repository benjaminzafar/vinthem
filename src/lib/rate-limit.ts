type RateLimitRule = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  mode: 'upstash' | 'memory';
};

const requestCounts = new Map<string, { count: number; resetTime: number }>();
const MAX_RATE_LIMIT_ENTRIES = 5000;

function cleanupExpiredRateLimits(now: number) {
  if (requestCounts.size < MAX_RATE_LIMIT_ENTRIES) {
    return;
  }

  for (const [key, value] of requestCounts.entries()) {
    if (value.resetTime <= now) {
      requestCounts.delete(key);
    }
  }

  if (requestCounts.size <= MAX_RATE_LIMIT_ENTRIES) {
    return;
  }

  const overflow = requestCounts.size - MAX_RATE_LIMIT_ENTRIES;
  const oldestEntries = Array.from(requestCounts.entries())
    .sort((a, b) => a[1].resetTime - b[1].resetTime)
    .slice(0, overflow);

  oldestEntries.forEach(([key]) => {
    requestCounts.delete(key);
  });
}

function getUpstashConfig() {
  const baseUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!baseUrl || !token) {
    return null;
  }

  return {
    baseUrl: baseUrl.replace(/\/$/, ''),
    token,
  };
}

async function checkUpstashRateLimit(key: string, rule: RateLimitRule, now: number): Promise<RateLimitResult> {
  const config = getUpstashConfig();

  if (!config) {
    throw new Error('Upstash rate limiting is not configured.');
  }

  const bucket = Math.floor(now / rule.windowMs);
  const bucketKey = `rate_limit:${key}:${bucket}`;
  const resetTime = (bucket + 1) * rule.windowMs;
  const expireSeconds = Math.max(Math.ceil((rule.windowMs * 2) / 1000), 1);

  const response = await fetch(`${config.baseUrl}/pipeline`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify([
      ['INCR', bucketKey],
      ['EXPIRE', bucketKey, expireSeconds],
    ]),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Upstash rate limit failed (${response.status}).`);
  }

  const payload = await response.json() as Array<{ result?: number | string | null }>;
  const currentCount = Number(payload[0]?.result ?? 0);

  return {
    allowed: currentCount <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - currentCount, 0),
    resetTime,
    mode: 'upstash',
  };
}

function checkMemoryRateLimit(key: string, rule: RateLimitRule, now: number): RateLimitResult {
  cleanupExpiredRateLimits(now);

  let current = requestCounts.get(key);
  if (!current || now > current.resetTime) {
    current = { count: 0, resetTime: now + rule.windowMs };
  }

  current.count += 1;
  requestCounts.set(key, current);

  return {
    allowed: current.count <= rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - current.count, 0),
    resetTime: current.resetTime,
    mode: 'memory',
  };
}

export async function checkRateLimit(key: string, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = Date.now();

  if (getUpstashConfig()) {
    try {
      return await checkUpstashRateLimit(key, rule, now);
    } catch (error) {
      console.error('[RateLimit] Upstash fallback triggered:', error);
    }
  }

  return checkMemoryRateLimit(key, rule, now);
}

export type { RateLimitRule, RateLimitResult };
