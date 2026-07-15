import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockWarn } = vi.hoisted(() => ({ mockWarn: vi.fn() }))
vi.mock('./logger', () => ({
  logger: { warn: mockWarn, error: vi.fn(), info: vi.fn(), debug: vi.fn() },
}))

import { isTransientDbError, withDbRetry } from './db-retry'

class NeonDbError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NeonDbError'
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('isTransientDbError', () => {
  it('flags NeonDbError, "fetch failed" and connection wording as transient', () => {
    expect(isTransientDbError(new NeonDbError('boom'))).toBe(true)
    expect(
      isTransientDbError(
        new Error('Error connecting to database: fetch failed')
      )
    ).toBe(true)
    expect(isTransientDbError(new Error('read ECONNRESET'))).toBe(true)
    expect(isTransientDbError(new Error('socket hang up'))).toBe(true)
  })

  it('unwraps a transient cause on a generic wrapper error', () => {
    const wrapper = new Error('query failed')
    wrapper.cause = new Error('fetch failed')
    expect(isTransientDbError(wrapper)).toBe(true)
  })

  it('does NOT flag ordinary query/logic errors as transient', () => {
    expect(isTransientDbError(new Error('column "foo" does not exist'))).toBe(
      false
    )
    expect(isTransientDbError('not even an error')).toBe(false)
  })
})

describe('withDbRetry', () => {
  it('returns the result on the first successful attempt (no retry)', async () => {
    const run = vi.fn().mockResolvedValue('ok')
    await expect(withDbRetry('op', run)).resolves.toBe('ok')
    expect(run).toHaveBeenCalledTimes(1)
    expect(mockWarn).not.toHaveBeenCalled()
  })

  it('retries a transient failure and succeeds on the second attempt (cold start)', async () => {
    const run = vi
      .fn()
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce('recovered')
    await expect(withDbRetry('op', run)).resolves.toBe('recovered')
    expect(run).toHaveBeenCalledTimes(2)
    // The retry is logged at WARN, not as an unhandled error.
    expect(mockWarn).toHaveBeenCalledTimes(1)
  })

  it('re-throws the last transient error after exhausting all attempts', async () => {
    const run = vi.fn().mockRejectedValue(new NeonDbError('down'))
    await expect(withDbRetry('op', run)).rejects.toThrow('down')
    expect(run).toHaveBeenCalledTimes(3)
  })

  it('does NOT retry a non-transient error (fails fast on the first attempt)', async () => {
    const run = vi.fn().mockRejectedValue(new Error('syntax error at or near'))
    await expect(withDbRetry('op', run)).rejects.toThrow('syntax error')
    expect(run).toHaveBeenCalledTimes(1)
    expect(mockWarn).not.toHaveBeenCalled()
  })
})
