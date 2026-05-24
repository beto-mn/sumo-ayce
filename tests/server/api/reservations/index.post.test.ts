import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockReadValidatedBody } = vi.hoisted(() => ({
  mockReadValidatedBody: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return {
    ...actual,
    readValidatedBody: mockReadValidatedBody,
    setResponseStatus: vi.fn(),
  }
})

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
const CREATED_ROW = {
  id: '00000000-0000-0000-0000-000000000099',
  ...VALID_BODY,
  reservationTime: '19:30:00',
  status: 'pending',
  notes: null,
  createdAt: new Date('2026-05-23T00:00:00Z'),
  updatedAt: new Date('2026-05-23T00:00:00Z'),
  deletedAt: null,
}

describe('POST /api/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates reservation and returns status pending', async () => {
    mockReadValidatedBody.mockResolvedValueOnce(VALID_BODY)
    mockDb.select.mockReturnValueOnce(dbChain([{ id: VALID_BODY.branchId }]))
    mockDb.insert.mockReturnValueOnce(dbChain([CREATED_ROW]))

    const result = await handler(event)

    expect(result).toEqual({ data: CREATED_ROW, error: null, meta: null })
    expect(mockDb.insert).toHaveBeenCalledOnce()
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
