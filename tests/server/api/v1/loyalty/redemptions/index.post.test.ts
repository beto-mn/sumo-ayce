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

import handler from '../../../../../../server/api/v1/loyalty/redemptions/index.post'

const event = {} as unknown as H3Event

const CUSTOMER_ID = '00000000-0000-0000-0000-000000000001'
const REWARD_ID = '00000000-0000-0000-0000-000000000004'
const BRANCH_ID = '00000000-0000-0000-0000-000000000002'
const STAFF_ID = '00000000-0000-0000-0000-000000000003'
const STAFF2_ID = '00000000-0000-0000-0000-000000000005'
const CUSTOMER_PHONE = '+521888'
const STAFF_PHONE = '+521999'

const CUSTOMER = {
  id: CUSTOMER_ID,
  name: 'Ana García',
  phone: CUSTOMER_PHONE,
  whatsappOptIn: true,
  pointsBalance: 30,
  deletedAt: null,
}

const REWARD = {
  id: REWARD_ID,
  name: 'Postre gratis',
  description: 'Selecciona uno',
  pointsCost: 20,
  isActive: true,
}

const STAFF_USER = { id: STAFF_ID, name: 'Carlos Staff', phone: STAFF_PHONE }
const STAFF2_USER = { id: STAFF2_ID, name: 'Luis Staff', phone: '+521000' }

const REDEMPTION_ROW = {
  id: '00000000-0000-0000-0000-000000000010',
  customerId: CUSTOMER_ID,
  rewardId: REWARD_ID,
  branchId: BRANCH_ID,
  ticketId: 'T-001',
  createdBy: STAFF_ID,
  status: 'used',
  usedAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
}

const VALID_BODY = {
  phone: CUSTOMER_PHONE,
  rewardId: REWARD_ID,
  branchId: BRANCH_ID,
  ticketId: 'T-001',
  staffId: STAFF_ID,
}

function setupDefault() {
  mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
  mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER])) // customer lookup
  mockDb.select.mockReturnValueOnce(dbChain([REWARD])) // reward lookup
  mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER])) // staff lookup
  mockDb.select.mockReturnValueOnce(dbChain([])) // FR-019: no earn for this ticket
  // tx: SELECT FOR UPDATE fresh customer
  mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
  // tx: insert redemption
  mockDb.insert.mockReturnValueOnce(dbChain([REDEMPTION_ROW]))
  // tx: update customer balance
  mockDb.update.mockReturnValueOnce(dbChain([]))
  // tx: insert loyaltyTransaction
  mockDb.insert.mockReturnValueOnce(dbChain([]))
}

describe('POST /api/v1/loyalty/redemptions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockDb.transaction.mockImplementation(
      async (fn: (tx: unknown) => Promise<unknown>) => fn(mockDb)
    )
    mockSendWhatsAppMessage.mockResolvedValue(undefined)
  })

  it('returns 201 with status=used, remainingBalance, ticketId', async () => {
    setupDefault()

    const result = await handler(event)

    expect(result.data.status).toBe('used')
    expect(result.data.remainingBalance).toBe(10) // 30 - 20
    expect(result.data.ticketId).toBe('T-001')
    expect(result.data.pointsDeducted).toBe(20)
    expect(result.data.usedAt).toBeDefined()
  })

  it('returns 422 when customer has insufficient balance', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...CUSTOMER, pointsBalance: 5 }])
    )
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    // tx: SELECT FOR UPDATE returns customer with balance 5
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...CUSTOMER, pointsBalance: 5 }])
    )
    mockDb.insert.mockReturnValueOnce(dbChain([REDEMPTION_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('returns 404 for unknown phone', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 404 when SQL WHERE filters out soft-deleted customer', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('returns 400 for inactive reward', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([{ ...REWARD, isActive: false }]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 404 for invalid rewardId', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('sends WhatsApp when whatsappOptIn=true', async () => {
    setupDefault()

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    expect(mockSendWhatsAppMessage).toHaveBeenCalledOnce()
    expect(mockSendWhatsAppMessage.mock.calls[0][0]).toBe(CUSTOMER_PHONE)
  })

  it('does not send WhatsApp when whatsappOptIn=false', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...CUSTOMER, whatsappOptIn: false }])
    )
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...CUSTOMER, pointsBalance: 30 }])
    )
    mockDb.insert.mockReturnValueOnce(dbChain([REDEMPTION_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([]))

    await handler(event)
    await new Promise(r => setTimeout(r, 10))

    expect(mockSendWhatsAppMessage).not.toHaveBeenCalled()
  })

  it('returns 409 on duplicate ticketId', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    mockDb.select.mockReturnValueOnce(dbChain([]))
    // Simulate unique constraint violation from inside the transaction
    const pgError = Object.assign(new Error('duplicate key'), { code: '23505' })
    mockDb.transaction.mockRejectedValueOnce(pgError)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('returns 403 when staff phone matches customer phone (FR-017)', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(
      dbChain([{ ...STAFF_USER, phone: CUSTOMER_PHONE }])
    )

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('returns 403 when same staff tries to earn and redeem on same ticket (FR-019)', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF_USER]))
    // FR-019: earn record on same ticket by same staff
    mockDb.select.mockReturnValueOnce(dbChain([{ createdBy: STAFF_ID }]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 })
  })

  it('allows redemption when earn was done by a different staff (FR-019)', async () => {
    const body = { ...VALID_BODY, staffId: STAFF2_ID }
    mockReadValidatedBody.mockResolvedValueOnce(body)
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.select.mockReturnValueOnce(dbChain([REWARD]))
    mockDb.select.mockReturnValueOnce(dbChain([STAFF2_USER]))
    // FR-019: earn record exists, but by STAFF_ID (different from STAFF2_ID)
    mockDb.select.mockReturnValueOnce(dbChain([{ createdBy: STAFF_ID }]))
    mockDb.select.mockReturnValueOnce(dbChain([CUSTOMER]))
    mockDb.insert.mockReturnValueOnce(
      dbChain([{ ...REDEMPTION_ROW, createdBy: STAFF2_ID }])
    )
    mockDb.update.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result.data.status).toBe('used')
  })
})
