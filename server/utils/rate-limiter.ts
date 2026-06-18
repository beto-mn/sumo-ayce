import type { H3Event } from 'h3'
import { getRequestIP } from 'h3'

interface Bucket {
  count: number
  resetAt: number
}

const store = new Map<string, Bucket>()

function getIp(event: H3Event): string {
  try {
    return getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
  } catch {
    return 'unknown'
  }
}

export function checkRateLimit(
  event: H3Event,
  key: string,
  maxAttempts: number,
  windowMs: number
): void {
  const mapKey = `${key}:${getIp(event)}`
  const now = Date.now()

  const bucket = store.get(mapKey)

  if (!bucket || now > bucket.resetAt) {
    store.set(mapKey, { count: 1, resetAt: now + windowMs })
    return
  }

  bucket.count++

  if (bucket.count > maxAttempts) {
    const retryAfter = Math.ceil((bucket.resetAt - now) / 1000)
    throw createError({
      statusCode: 429,
      statusMessage: `Too many attempts. Try again in ${retryAfter}s.`,
    })
  }
}

export function resetRateLimit(event: H3Event, key: string): void {
  store.delete(`${key}:${getIp(event)}`)
}
