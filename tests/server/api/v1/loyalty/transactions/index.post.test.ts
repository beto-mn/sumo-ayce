import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../../../mocks/db'

vi.mock('../../../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../../../mocks/db')
  return { db: mockDb }
})

const { mockReadValidatedBody, mockSendWhatsAppMessage } = vi.hoisted(() => ({
  mockReadValidatedBody: vi.fn(),
  mockSendWhatsAppMessage: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return {
    ...actual,
    readValidatedBody: mockReadValidatedBody,
    setResponseStatus: vi.fn(),
  }
})

vi.mock('../../../../../../server/utils/twilio', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  normalizePhone: (p: string) => p,
}))

vi.mock('../../../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('../../../../../../server/utils/loyalty-config', () => ({
  loyaltyConfig: { pointsPerVisit: 10, velocityThreshold: 5 },
}))

import handler from '../../../../../../server/api/v1/loyalty/transactions/index.post'

const event = {} as unknown as H3Event

const CUSTOMER_ID = '00000000-0000-0000-0000-000000000001'
const BRANCH_ID = '00000000-0000-0000-0000-000000000002'
const STAFF_ID = '00000000-0000-0000-0000-000000000003'
const STAFF_PHONE = '+521999'
const CUSTOMER_PHONE = '+521888'

const ACTIVE_CUSTOMER = {
  id: CUSTOMER_ID,
  name: 'Ana García',
  phone: CUSTOMER_PHONE,
  whatsappOptIn: true,
  pointsBalance: 0,
  deletedAt: null,
}

const STAFF_USER = {
  id: STAFF_ID,
  name: 'Carlos Staff',
  phone: STAFF_PHONE,
}

const BRANCH = {
  id: BRANCH_ID,
  name: 'SUMO Polanco',
  managerPhone: '+521777',
}

const VALID_BODY = {
  phone: CUSTOMER_PHONE,
  branchId: BRANCH_ID,
  ticketId: 'T-001',
  staffId: STAFF_ID,
  points: 10,
}

const TRANSACTION_ROW = {
  id: '00000000-0000-0000-0000-000000000010',
  customerId: CUSTOMER_ID,
  branchId: BRANCH_ID,
  pointsDelta: 10,
  transactionType: 'earn',
  ticketId: 'T-001',
  createdBy: STAFF_ID,
  createdAt: new Date(),
}

function setupDefault() {
  mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
  // customer lookup
  mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
  // staff lookup
  mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
  // today's earn count
  mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
  // active rewards
  mockDb.select.mockReturnValueOnce(dbChain([]))
  // tx: update customer
  mockDb.update.mockReturnValueOnce(dbChain([]))
  // tx: insert transaction
  mockDb.insert.mockReturnValueOnce(dbChain([TRANSACTION_ROW]))
  // velocity check: count earns last hour (1 < threshold 5, no branch lookup)
  mockDb.select.mockReturnValueOnce(dbChain([{ count: 1 }]))
}

describe('POST /api/v1/loyalty/transactions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDb.transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(mockDb)
    )
    mockSendWhatsAppMessage.mockResolvedValue(undefined)
  })

  it('returns 201 with correct pointsDelta and newBalance', async () => {
    setupDefault()

    const result = await handler(event)

    expect(result.data.pointsDelta).toBe(10)
    expect(result.data.newBalance).toBe(10)
    expect(result.data.transactionType).toBe('earn')
  })

  it('uses points from body as pointsDelta', async () => {
    mockReadValidatedBody.mockResolvedValueOnce({ ...VALID_BODY, points: 25 })
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(
      dbChain([{ ...TRANSACTION_ROW, pointsDelta: 25 }])
    )
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 1 }]))

    const result = await handler(event)

    expect(result.data.pointsDelta).toBe(25)
    expect(result.data.newBalance).toBe(25)
  })

  it('returns 400 when points is missing', async () => {
    const { z } = await import('zod')
    const zodErr = z.number().int().positive().safeParse(undefined).error
    mockReadValidatedBody.mockRejectedValueOnce(zodErr)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when points is zero or negative', async () => {
    const { z } = await import('zod')
    const zodErr = z.number().int().positive().safeParse(0).error
    mockReadValidatedBody.mockRejectedValueOnce(zodErr)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 for unknown phone', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 404 for customer with deletedAt set', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    // SQL WHERE isNull(deletedAt) returns no rows — mock the filtered result
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('sends earn WhatsApp when whatsappOptIn=true', async () => {
    setupDefault()

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    expect(mockSendWhatsAppMessage).toHaveBeenCalled()
  })

  it('does not send earn WhatsApp when whatsappOptIn=false', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...ACTIVE_CUSTOMER, whatsappOptIn: false }])
    )
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([TRANSACTION_ROW]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 1 }]))

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    expect(mockSendWhatsAppMessage).not.toHaveBeenCalledWith(
      CUSTOMER_PHONE,
      expect.any(String)
    )
  })

  it('sends second WhatsApp when new balance unlocks a reward', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    const reward = {
      id: 'r1',
      name: 'Refresco',
      description: null,
      pointsCost: 10,
    }
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
    mockDb.select.mockReturnValueOnce(dbChain([reward]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([TRANSACTION_ROW]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 1 }]))

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(2)
  })

  it('returns 409 when customer already earned points today', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 1 }]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('returns 403 when staff phone matches customer phone', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...STAFF_USER, phone: CUSTOMER_PHONE }])
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('sends velocity alert to manager when threshold exceeded', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([TRANSACTION_ROW]))
    // velocity count = 5 (at threshold)
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 5 }]))
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH]))

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    const calls = mockSendWhatsAppMessage.mock.calls
    const alertCall = calls.find(c => c[0] === BRANCH.managerPhone)
    expect(alertCall).toBeDefined()
  })

  it('skips velocity alert when branch has no managerPhone', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 0 }]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([TRANSACTION_ROW]))
    mockDb.select.mockReturnValueOnce(dbChain([{ count: 5 }]))
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...BRANCH, managerPhone: null }])
    )

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    // Only earn WhatsApp, no alert
    const alertCall = mockSendWhatsAppMessage.mock.calls.find(
      c => c[0] === BRANCH.managerPhone
    )
    expect(alertCall).toBeUndefined()
  })
})
