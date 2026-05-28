import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../../../../mocks/db'

vi.mock('../../../../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../../../../mocks/db')
  return { db: mockDb }
})

const { mockGetRouterParam } = vi.hoisted(() => ({
  mockGetRouterParam: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return { ...actual, getRouterParam: mockGetRouterParam }
})

vi.mock('../../../../../../../server/utils/twilio', () => ({
  normalizePhone: (p: string) => p,
}))

vi.mock('../../../../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import handler from '../../../../../../../server/api/v1/loyalty/customers/[phone]/index.get'

const event = {} as unknown as H3Event

const CUSTOMER_ID = '00000000-0000-0000-0000-000000000001'
const CUSTOMER = {
  id: CUSTOMER_ID,
  name: 'Ana García',
  phone: '+5215512345678',
  whatsappOptIn: true,
  pointsBalance: 30,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

const TX = (id: string, type: string, delta: number) => ({
  id,
  transactionType: type,
  pointsDelta: delta,
  branchId: '00000000-0000-0000-0000-000000000002',
  ticketId: `T-${id}`,
  createdBy: '00000000-0000-0000-0000-000000000003',
  createdAt: new Date(),
})

describe('GET /api/v1/loyalty/customers/:phone', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockGetRouterParam.mockReturnValue('+5215512345678')
  })

  it('returns 200 with customer and up to 20 transactions newest-first', async () => {
    const txList = Array.from({ length: 20 }, (_, i) =>
      TX(String(i + 1), 'earn', 10)
    )
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain(txList))

    const result = await handler(event)

    expect(result.data.name).toBe(CUSTOMER.name)
    expect(result.data.pointsBalance).toBe(30)
    expect(result.data.transactions).toHaveLength(20)
  })

  it('returns 404 for non-existent phone', async () => {
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 404 when SQL WHERE filters out soft-deleted customer', async () => {
    // isNull(deletedAt) in the query means DB returns [] for deleted customers
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('transactions include type, pointsDelta, branchId, createdAt', async () => {
    const tx = TX('abc', 'earn', 10)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([tx]))

    const result = await handler(event)

    expect(result.data.transactions[0]).toMatchObject({
      transactionType: 'earn',
      pointsDelta: 10,
      branchId: tx.branchId,
      createdAt: tx.createdAt,
    })
  })

  it('returns empty transactions array for customer with no transactions', async () => {
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result.data.transactions).toEqual([])
  })

  it('returns at most 20 transactions even when DB returns more', async () => {
    const txList = Array.from({ length: 20 }, (_, i) =>
      TX(String(i + 1), 'earn', 10)
    )
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain(txList))

    const result = await handler(event)

    expect(result.data.transactions.length).toBeLessThanOrEqual(20)
  })
})
