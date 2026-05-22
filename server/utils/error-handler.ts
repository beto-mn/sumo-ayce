import { createError, H3Error } from 'h3'
import { ZodError } from 'zod'
import { logger } from './logger'

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

  logger.error(error, 'Unhandled server error')

  return createError({
    statusCode: 500,
    statusMessage: 'Internal Server Error',
  })
}
