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

export class ExternalServiceError extends Error {
  readonly statusCode = 502
  constructor(service: string, cause?: unknown) {
    super(`External service error: ${service}`)
    this.name = 'ExternalServiceError'
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
    error instanceof ConflictError
  ) {
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
