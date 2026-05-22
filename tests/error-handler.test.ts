import { createError } from 'h3'
import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'
import { handleError } from '../server/utils/error-handler'

describe('handleError', () => {
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
})
