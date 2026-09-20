// Small in-memory sliding-window limiter. Fine for a single-process app serving a small group.
const g = globalThis as unknown as { __pieRL?: Map<string, number[]> }
const store: Map<string, number[]> = (g.__pieRL ??= new Map())

function recent(key: string, windowMs: number): number[] {
  const now = Date.now()
  return (store.get(key) ?? []).filter((t) => now - t < windowMs)
}

export function hit(key: string, windowMs: number) {
  const arr = recent(key, windowMs)
  arr.push(Date.now())
  store.set(key, arr)
}

export function limited(key: string, max: number, windowMs: number): boolean {
  return recent(key, windowMs).length >= max
}

/** Returns true if the action is allowed (and records it), false if over the limit. */
export function consume(key: string, max: number, windowMs: number): boolean {
  if (limited(key, max, windowMs)) return false
  hit(key, windowMs)
  return true
}

export function pruneRateLimits(maxAgeMs = 60 * 60 * 1000) {
  const now = Date.now()
  for (const [k, arr] of store) {
    const keep = arr.filter((t) => now - t < maxAgeMs)
    if (keep.length) store.set(k, keep)
    else store.delete(k)
  }
}
