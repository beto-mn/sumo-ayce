import { logger } from './logger'

/** Total attempts (1 initial + retries). Neon cold starts almost always succeed on attempt 2. */
const MAX_ATTEMPTS = 3
/** Base backoff in ms; grows linearly per attempt (150ms, 300ms). */
const BACKOFF_BASE_MS = 150

/**
 * True when an error looks like a TRANSIENT Neon connection failure — the class
 * of error a retry can recover (cold start / dropped socket), NOT a query bug.
 * Matches `NeonDbError`, the serverless driver's "Error connecting to database:
 * fetch failed", and generic connection/socket/timeout wording.
 */
export function isTransientDbError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  if (error.name === 'NeonDbError') return true
  const message =
    `${error.message} ${error.cause instanceof Error ? error.cause.message : ''}`.toLowerCase()
  return (
    message.includes('fetch failed') ||
    message.includes('error connecting to database') ||
    message.includes('connection') ||
    message.includes('econnreset') ||
    message.includes('econnrefused') ||
    message.includes('etimedout') ||
    message.includes('socket hang up')
  )
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Runs a Neon read with a small retry on transient connection errors. Retries up
 * to {@link MAX_ATTEMPTS} with a short linear backoff; non-transient errors (real
 * query/logic failures) are re-thrown immediately without retrying. If every
 * attempt fails with a transient error, the last error is thrown for the caller
 * to categorize as a handled `DatabaseUnavailableError` (WARN, graceful fallback).
 */
export async function withDbRetry<T>(
  operation: string,
  run: () => Promise<T>
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      return await run()
    } catch (error) {
      lastError = error
      if (!isTransientDbError(error) || attempt === MAX_ATTEMPTS) throw error
      logger.warn(
        { operation, attempt, maxAttempts: MAX_ATTEMPTS },
        'Transient database error — retrying'
      )
      await delay(BACKOFF_BASE_MS * attempt)
    }
  }
  // Unreachable: the loop either returns or throws, but satisfies the type checker.
  throw lastError
}
