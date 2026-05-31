import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ForbiddenError } from '../../../../../../utils/error-handler'

const {
  mockRequireStaffAuth,
  mockDbSelect,
  mockDbTransaction,
  mockGetRouterParam,
  mockReadValidatedBody,
} = vi.hoisted(() => ({
  mockRequireStaffAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockGetRouterParam: vi.fn().mockReturnValue('tx-uuid'),
  mockReadValidatedBody: vi
    .fn()
    .mockResolvedValue({ reason: 'Error del cajero' }),
}))

vi.mock('../../../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../../../utils/db', () => ({
  db: { select: mockDbSelect, update: vi.fn(), transaction: mockDbTransaction },
}))
vi.mock('../../../../../../db/schema', () => ({
  loyaltyTransactions: {},
  customers: {},
}))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    getRouterParam: mockGetRouterParam,
    readValidatedBody: mockReadValidatedBody,
  }
})
vi.mock('../../../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './void.post'

const activeTransaction = {
  id: 'tx-uuid',
  customerId: 'c1',
  branchId: 'branch-uuid',
  pointsDelta: 1,
  deletedAt: null as Date | null,
}

function setupSelectMocks(txRow = activeTransaction) {
  let selectIdx = 0
  mockDbSelect.mockImplementation(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockImplementation(() => {
          selectIdx++
          if (selectIdx === 1) return Promise.resolve([txRow])
          return Promise.resolve([{ pointsBalance: 4 }])
        }),
      }),
    }),
  }))
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'admin-uuid',
    role: 'admin',
    branchId: 'branch-uuid',
  })
  mockGetRouterParam.mockReturnValue('tx-uuid')
  mockReadValidatedBody.mockResolvedValue({ reason: 'Error del cajero' })
  mockDbTransaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        update: vi.fn().mockReturnValue({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
        }),
      }
      await fn(tx)
    }
  )
})

describe('POST /api/v1/staff/admin/transactions/[id]/void', () => {
  it('voids transaction and returns new balance', async () => {
    setupSelectMocks()
    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { customerNewBalance: number } }
    expect(result.data.customerNewBalance).toBe(4)
  })

  it('throws 409 when transaction already voided', async () => {
    setupSelectMocks({ ...activeTransaction, deletedAt: new Date() })
    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 409
    )
  })

  it('throws 404 when transaction not found in branch', async () => {
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi
          .fn()
          .mockReturnValue({ limit: vi.fn().mockResolvedValue([]) }),
      }),
    })
    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 404
    )
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
})
