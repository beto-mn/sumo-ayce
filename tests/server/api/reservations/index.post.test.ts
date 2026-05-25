import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
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

vi.mock('../../../../server/utils/twilio', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  normalizePhone: (p: string) => p,
}))

vi.mock('../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import handler from '../../../../server/api/reservations/index.post'

const event = {} as unknown as H3Event

const FUTURE_DATE = '2099-12-31'
const VALID_BODY = {
  branchId: '00000000-0000-0000-0000-000000000001',
  contactName: 'Juan Pérez',
  contactPhone: '8112345678',
  partySize: 4,
  reservationDate: FUTURE_DATE,
  reservationTime: '19:30',
}
const BRANCH_WITH_WHATSAPP = {
  id: VALID_BODY.branchId,
  name: 'Sucursal Centro',
  whatsappReservaciones: '+528112345678',
}
const BRANCH_WITHOUT_WHATSAPP = {
  id: VALID_BODY.branchId,
  name: 'Sucursal Centro',
  whatsappReservaciones: null,
}

function makeCreatedRow(folio = 'AABBCCDD') {
  return {
    id: '00000000-0000-0000-0000-000000000099',
    folio,
    ...VALID_BODY,
    reservationTime: '19:30:00',
    status: 'pending',
    notes: null,
    firstReminderAt: null,
    escalatedAt: null,
    createdAt: new Date('2026-05-23T00:00:00Z'),
    updatedAt: new Date('2026-05-23T00:00:00Z'),
    deletedAt: null,
  }
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates reservation and response includes folio', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select
      .mockReturnValueOnce(dbChain([{ id: VALID_BODY.branchId }]))
      .mockReturnValueOnce(dbChain([BRANCH_WITH_WHATSAPP]))
    mockDb.insert.mockReturnValueOnce(dbChain([makeCreatedRow()]))
    mockSendWhatsAppMessage.mockResolvedValue(undefined)

    const result = await handler(event)

    expect(result.data).toMatchObject({ status: 'pending' })
    expect(typeof result.data.folio).toBe('string')
    expect(result.data.folio).toHaveLength(8)
  })

  it('calls sendWhatsAppMessage twice when branch has whatsapp number', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select
      .mockReturnValueOnce(dbChain([{ id: VALID_BODY.branchId }]))
      .mockReturnValueOnce(dbChain([BRANCH_WITH_WHATSAPP]))
    mockDb.insert.mockReturnValueOnce(dbChain([makeCreatedRow()]))
    mockSendWhatsAppMessage.mockResolvedValue(undefined)

    await handler(event)

    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(2)
  })

  it('still returns 201 when Twilio fails', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select
      .mockReturnValueOnce(dbChain([{ id: VALID_BODY.branchId }]))
      .mockReturnValueOnce(dbChain([BRANCH_WITH_WHATSAPP]))
    mockDb.insert.mockReturnValueOnce(dbChain([makeCreatedRow()]))
    mockSendWhatsAppMessage.mockRejectedValue(new Error('Twilio down'))

    const result = await handler(event)

    expect(result.data).toBeDefined()
    expect(result.data.status).toBe('pending')
  })

  it('still returns 201 when branch has no whatsapp number', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select
      .mockReturnValueOnce(dbChain([{ id: VALID_BODY.branchId }]))
      .mockReturnValueOnce(dbChain([BRANCH_WITHOUT_WHATSAPP]))
    mockDb.insert.mockReturnValueOnce(dbChain([makeCreatedRow()]))
    mockSendWhatsAppMessage.mockResolvedValue(undefined)

    const result = await handler(event)

    expect(result.data.status).toBe('pending')
    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1)
  })

  it('throws 422 when branchId does not exist in db', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 422 })
  })

  it('schema rejects partySize of 0', async () => {
    const { CreateReservationSchema } = await import(
      '../../../../types/reservations'
    )
    const result = CreateReservationSchema.safeParse({
      ...VALID_BODY,
      partySize: 0,
    })
    expect(result.success).toBe(false)
  })

  it('schema rejects missing required field', async () => {
    const { CreateReservationSchema } = await import(
      '../../../../types/reservations'
    )
    const { contactName: _, ...bodyWithoutName } = VALID_BODY
    const result = CreateReservationSchema.safeParse(bodyWithoutName)
    expect(result.success).toBe(false)
  })

  it('schema rejects past reservationDate', async () => {
    const { CreateReservationSchema } = await import(
      '../../../../types/reservations'
    )
    const result = CreateReservationSchema.safeParse({
      ...VALID_BODY,
      reservationDate: '2000-01-01',
    })
    expect(result.success).toBe(false)
  })
})
