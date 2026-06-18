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
  rewards: {},
  redemptions: {},
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
vi.mock('../../../../utils/loyalty-messages', () => ({
  msgLoyaltyCanje: vi.fn().mockReturnValue('msg'),
}))
vi.mock('../../../../utils/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './index.post'

const customer = {
  id: 'c1',
  name: 'María',
  phone: '+52551',
  pointsBalance: 20,
  whatsappOptIn: false,
  deletedAt: null,
}
const reward = {
  id: 'r1',
  name: 'Postre',
  description: null,
  pointsCost: 10,
  isActive: true,
}

function setupMocks(
  opts: { customerBalance?: number; txFail?: boolean; todayCount?: number } = {}
) {
  const c = { ...customer, pointsBalance: opts.customerBalance ?? 20 }

  // Call 1: customer lookup
  mockDbSelect.mockImplementationOnce(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([c]),
      }),
    }),
  }))
  // Call 2: reward lookup
  mockDbSelect.mockImplementationOnce(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue([reward]),
      }),
    }),
  }))
  // Call 3: today's redemption count
  mockDbSelect.mockImplementationOnce(() => ({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([{ count: opts.todayCount ?? 0 }]),
    }),
  }))

  mockDbTransaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<void>) => {
      if (opts.txFail) throw { code: '23505' }
      const tx = {
        update: vi.fn().mockReturnValue({
          set: vi
            .fn()
            .mockReturnValue({ where: vi.fn().mockResolvedValue([]) }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi
              .fn()
              .mockResolvedValue([{ id: 'red1', createdAt: new Date() }]),
          }),
        }),
      }
      await fn(tx)
    }
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'staff-uuid',
    role: 'staff',
    branchId: 'branch-uuid',
  })
})

describe('POST /api/v1/staff/redemptions', () => {
  it('redeems reward and returns new balance', async () => {
    setupMocks()
    mockReadValidatedBody.mockResolvedValue({
      phone: '+52551',
      rewardId: 'r1',
      ticketId: 'TKT-003',
    })

    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { newBalance: number; rewardName: string } }
    expect(result.data.newBalance).toBe(10)
    expect(result.data.rewardName).toBe('Postre')
  })

  it('throws 409 when insufficient points', async () => {
    setupMocks({ customerBalance: 5 })
    mockReadValidatedBody.mockResolvedValue({
      phone: '+52551',
      rewardId: 'r1',
      ticketId: 'TKT-004',
    })

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 409
    )
  })

  it('throws 409 on duplicate ticketId', async () => {
    setupMocks({ txFail: true })
    mockReadValidatedBody.mockResolvedValue({
      phone: '+52551',
      rewardId: 'r1',
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
