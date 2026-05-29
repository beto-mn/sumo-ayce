import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError, ForbiddenError } from '../../../../../utils/error-handler'

const { mockRequireStaffAuth, mockDbSelect } = vi.hoisted(() => ({
  mockRequireStaffAuth: vi.fn(),
  mockDbSelect: vi.fn(),
}))

vi.mock('../../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../../utils/db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../../../../../db/schema', () => ({
  loyaltyTransactions: {},
  redemptions: {},
  customers: {},
  branches: {},
}))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    getQuery: vi.fn().mockReturnValue({}),
  }
})
vi.mock('../../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './daily.get'

function makeCountSelect(value: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: value, total: value }]),
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'admin-uuid',
    role: 'admin',
    branchId: 'branch-uuid',
  })

  let callIdx = 0
  mockDbSelect.mockImplementation(() => {
    callIdx++
    if (callIdx <= 6) return makeCountSelect(callIdx <= 5 ? 10 : 1)
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([{ name: 'SUMO Satelite' }]),
        }),
      }),
    }
  })
})

describe('GET /api/v1/staff/admin/reports/daily', () => {
  it('returns daily metrics', async () => {
    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { visitsCount: number } }
    expect(typeof result.data.visitsCount).toBe('number')
  })

  it('throws 403 when role is staff', async () => {
    mockRequireStaffAuth.mockRejectedValue(
      new ForbiddenError('Insufficient role')
    )

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 403
    )
  })

  it('throws 401 when no session', async () => {
    mockRequireStaffAuth.mockRejectedValue(new AuthError())

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 401
    )
  })
})
