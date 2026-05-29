import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDbDelete, mockGetCookie, mockSetCookie } = vi.hoisted(() => ({
  mockDbDelete: vi.fn(),
  mockGetCookie: vi.fn(),
  mockSetCookie: vi.fn(),
}))

vi.mock('../../../../utils/db', () => ({ db: { delete: mockDbDelete } }))
vi.mock('../../../../db/schema', () => ({ staffSessions: {} }))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    getCookie: mockGetCookie,
    setCookie: mockSetCookie,
  }
})
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './logout.post'

beforeEach(() => {
  vi.clearAllMocks()
  mockDbDelete.mockReturnValue({ where: vi.fn().mockResolvedValue([]) })
})

describe('POST /api/v1/staff/auth/logout', () => {
  it('deletes session and clears cookie when token present', async () => {
    mockGetCookie.mockReturnValue('valid-token')
    const whereMock = vi.fn().mockResolvedValue([])
    mockDbDelete.mockReturnValue({ where: whereMock })

    const result = await (handler as (event: unknown) => Promise<unknown>)({})

    expect(whereMock).toHaveBeenCalled()
    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      'staff_session',
      '',
      expect.objectContaining({ maxAge: 0 })
    )
    expect(result).toEqual({ data: { ok: true } })
  })

  it('clears cookie even when no token in request (idempotent)', async () => {
    mockGetCookie.mockReturnValue(undefined)

    await (handler as (event: unknown) => Promise<unknown>)({})

    expect(mockSetCookie).toHaveBeenCalledWith(
      expect.anything(),
      'staff_session',
      '',
      expect.objectContaining({ maxAge: 0 })
    )
  })
})
