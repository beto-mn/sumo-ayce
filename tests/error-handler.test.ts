import { createError } from 'h3'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod'
import {
  DatabaseUnavailableError,
  ExternalServiceError,
  handleError,
} from '../server/utils/error-handler'
import { logger } from '../server/utils/logger'

describe('handleError', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns H3Error as-is', () => {
    const original = createError({
      statusCode: 404,
      statusMessage: 'Not Found',
    })
    expect(handleError(original)).toBe(original)
  })

  it('maps ZodError to 400', () => {
    const zod = new ZodError([])
    const result = handleError(zod)
    expect(result.statusCode).toBe(400)
    expect(result.statusMessage).toBe('Validation Error')
  })

  it('maps unknown errors to 500', () => {
    const result = handleError(new Error('boom'))
    expect(result.statusCode).toBe(500)
    expect(result.statusMessage).toBe('Internal Server Error')
  })

  it('maps ExternalServiceError to 502 and logs at WARN (not ERROR)', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

    const result = handleError(
      new ExternalServiceError('WordPress promociones', new Error('timeout'))
    )

    expect(result.statusCode).toBe(502)
    expect(result.statusMessage).toBe(
      'External service error: WordPress promociones'
    )
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('maps DatabaseUnavailableError to 503 and logs at WARN (not ERROR)', () => {
    const warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const errorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})

    const result = handleError(
      new DatabaseUnavailableError('getFullMenu', new Error('fetch failed'))
    )

    expect(result.statusCode).toBe(503)
    expect(result.statusMessage).toBe('Database unavailable: getFullMenu')
    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy).not.toHaveBeenCalled()
  })
})
