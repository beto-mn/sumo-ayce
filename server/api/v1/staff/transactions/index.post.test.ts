import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError } from '../../../../utils/error-handler'

const {
  mockRequireStaffAuth,
  mockDbSelect,
  mockDbTransaction,
  mockReadValidatedBody,
} = vi.hoisted(() => ({
  mockRequireStaffAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockReadValidatedBody: vi.fn(),
}))

vi.mock('../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../utils/db', () => ({
  db: {
    select: mockDbSelect,
    update: vi.fn(),
    insert: vi.fn(),
    transaction: mockDbTransaction,
  },
}))
vi.mock('../../../../db/schema', () => ({
  customers: {},
  loyaltyTransactions: {},
  rewards: {},
}))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    readValidatedBody: mockReadValidatedBody,
    setResponseStatus: vi.fn(),
  }
})
vi.mock('../../../../utils/twilio', () => ({
  normalizePhone: (p: string) => p,
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../../../utils/loyalty-config', () => ({
  loyaltyConfig: { pointsPerVisit: 1, velocityThreshold: 0 },
}))
vi.mock('../../../../utils/loyalty-messages', () => ({
  msgLoyaltyPuntosGanados: vi.fn().mockReturnValue('msg'),
  msgLoyaltyRecompensasDesbloqueadas: vi.fn().mockReturnValue('msg'),
}))
vi.mock('../../../../utils/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './index.post'

const mockCustomer = {
  id: 'cust-uuid',
  name: 'María',
  phone: '+52551',
  pointsBalance: 5,
  whatsappOptIn: false,
  deletedAt: null,
}

function setupDbMocks(opts: { txSuccess?: boolean } = {}) {
  mockDbSelect
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockCustomer]),
        }),
      }),
    })
    .mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([{ count: 0 }]),
      }),
    })
    .mockReturnValue({
      from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
    })

  mockDbTransaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<void>) => {
      if (opts.txSuccess === false) throw { code: '23505' }
      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: 'tx-uuid', createdAt: new Date() }]),
          }),
        }),
      }
      await fn(mockTx)
    }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'staff-uuid',
    role: 'staff',
    branchId: 'branch-uuid',
    email: 'staff@sumo.com',
  })
})

describe('POST /api/v1/staff/transactions', () => {
  it('registers visit and returns new balance', async () => {
    setupDbMocks()
    mockReadValidatedBody.mockResolvedValue({
      phone: '+52551',
      ticketId: 'TKT-001',
    })

    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { newBalance: number } }
    expect(result.data.newBalance).toBe(6)
  })

  it('throws 409 when ticket already used', async () => {
    setupDbMocks({ txSuccess: false })
    mockReadValidatedBody.mockResolvedValue({
      phone: '+52551',
      ticketId: 'DUP',
    })

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 409
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
