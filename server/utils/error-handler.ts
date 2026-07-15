import { createError, H3Error } from 'h3'
import { ZodError } from 'zod'
import { logger } from './logger'

export class UnprocessableError extends Error {
  readonly statusCode = 422
  constructor(message: string) {
    super(message)
    this.name = 'UnprocessableError'
  }
}

export class NotFoundError extends Error {
  readonly statusCode = 404
  constructor(resource: string) {
    super(`${resource} not found`)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends Error {
  readonly statusCode = 409
  constructor(message: string) {
    super(message)
    this.name = 'ConflictError'
  }
}

export class AuthError extends Error {
  readonly statusCode = 401
  constructor(message = 'Unauthorized') {
    super(message)
    this.name = 'AuthError'
  }
}

export class ForbiddenError extends Error {
  readonly statusCode = 403
  constructor(message: string) {
    super(message)
    this.name = 'ForbiddenError'
  }
}

export class ExternalServiceError extends Error {
  readonly statusCode = 502
  constructor(service: string, cause?: unknown) {
    super(`External service error: ${service}`)
    this.name = 'ExternalServiceError'
    this.cause = cause
  }
}

/**
 * The Neon database is transiently unavailable (cold start / connection blip)
 * and stayed unavailable after retries. This is an EXPECTED degradation — the
 * caller falls back to an empty result — so it is logged at WARN (not the
 * alarming "Unhandled server error") and returns 503 Service Unavailable.
 */
export class DatabaseUnavailableError extends Error {
  readonly statusCode = 503
  constructor(operation: string, cause?: unknown) {
    super(`Database unavailable: ${operation}`)
    this.name = 'DatabaseUnavailableError'
    this.cause = cause
  }
}

export function handleError(error: unknown): H3Error {
  if (error instanceof H3Error) return error

  if (error instanceof ZodError) {
    logger.warn({ issues: error.issues }, 'Validation error')
    return createError({
      statusCode: 400,
      statusMessage: 'Validation Error',
      data: error.issues,
    })
  }

  if (
    error instanceof UnprocessableError ||
    error instanceof NotFoundError ||
    error instanceof ConflictError ||
    error instanceof ForbiddenError ||
    error instanceof AuthError
  ) {
    return createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
    })
  }

  // Expected upstream-dependency unavailability (e.g. WordPress timeout). This
  // is a HANDLED degradation — callers fall back gracefully — so it must NOT be
  // logged as an alarming "Unhandled server error". Log at WARN with the
  // service name/cause and return the 502 it carries.
  if (error instanceof ExternalServiceError) {
    logger.warn({ err: error }, 'External service unavailable')
    return createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
    })
  }

  // Transient Neon unavailability that survived retries. HANDLED degradation —
  // callers return an empty result — so WARN, never ERROR "Unhandled server error".
  if (error instanceof DatabaseUnavailableError) {
    logger.warn({ err: error }, 'Database unavailable')
    return createError({
      statusCode: error.statusCode,
      statusMessage: error.message,
    })
  }

  logger.error(error, 'Unhandled server error')

  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
  })
}
