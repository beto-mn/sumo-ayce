import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError, ForbiddenError } from '../../../../../utils/error-handler'

const { mockRequireStaffAuth, mockDbSelect, mockRowsQuery } = vi.hoisted(
  () => ({
    mockRequireStaffAuth: vi.fn(),
    mockDbSelect: vi.fn(),
    mockRowsQuery: vi.fn(),
  })
)

vi.mock('../../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../../utils/db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../../../../../db/schema', () => ({
  loyaltyTransactions: {},
  customers: {},
  staffUsers: {},
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

import handler from './index.get'

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'admin-uuid',
    role: 'admin',
    branchId: 'branch-uuid',
  })

  // Count query: .select().from().where() → [{ total }]
  mockDbSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ total: 2 }]),
    }),
  })
  // Rows query: .select().from().innerJoin().leftJoin().where().orderBy().limit().offset()
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        leftJoin: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue({ offset: mockRowsQuery }),
            }),
          }),
        }),
      }),
    }),
  })
})

describe('GET /api/v1/staff/admin/transactions', () => {
  it('returns paginated transactions', async () => {
    mockRowsQuery.mockResolvedValue([
      {
        id: 'tx1',
        type: 'earn',
        pointsDelta: 1,
        ticketId: 'T1',
        voidedAt: null,
        createdAt: new Date(),
        customerId: 'c1',
        customerName: 'María',
        customerPhone: '+52551',
        staffId: 'staff-uuid',
        staffName: 'Juan',
      },
    ])

    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { transactions: object[] } }
    expect(Array.isArray(result.data.transactions)).toBe(true)
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
