export type RateLimiter = {
  isBlocked: (key: string, now?: number) => boolean
  recordFailure: (key: string, now?: number) => void
  reset: (key: string) => void
}

export function createRateLimiter(
  maxFailures: number,
  windowMs: number
): RateLimiter {
  const failures = new Map<string, Array<number>>()

  const recent = (key: string, now: number): Array<number> => {
    const kept = (failures.get(key) ?? []).filter((t) => now - t < windowMs)
    if (kept.length > 0) failures.set(key, kept)
    else failures.delete(key)
    return kept
  }

  return {
    isBlocked: (key, now = Date.now()): boolean =>
      recent(key, now).length >= maxFailures,
    recordFailure: (key, now = Date.now()): void => {
      failures.set(key, [...recent(key, now), now])
    },
    reset: (key): void => {
      failures.delete(key)
    },
  }
}
