type CounterMap = Map<string, number[]>;

declare global {
  // eslint-disable-next-line no-var
  var __g2gRateLimitMap: CounterMap | undefined;
}

function getStore(): CounterMap {
  if (!global.__g2gRateLimitMap) {
    global.__g2gRateLimitMap = new Map<string, number[]>();
  }
  return global.__g2gRateLimitMap;
}

export function consumeIpRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const store = getStore();
  const timestamps = store.get(key) ?? [];
  const pruned = timestamps.filter((ts) => now - ts < windowMs);

  if (pruned.length >= maxRequests) {
    const oldest = pruned[0] ?? now;
    const retryAfterSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(key, pruned);
    return { allowed: false, retryAfterSeconds };
  }

  pruned.push(now);
  store.set(key, pruned);
  return { allowed: true, retryAfterSeconds: 0 };
}
