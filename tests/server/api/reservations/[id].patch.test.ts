import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockReadValidatedBody, mockGetRouterParam } = vi.hoisted(() => ({
  mockReadValidatedBody: vi.fn(),
  mockGetRouterParam: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return {
    ...actual,
    readValidatedBody: mockReadValidatedBody,
    getRouterParam: mockGetRouterParam,
  }
})

import handler from '../../../../server/api/v1/reservations/[id].patch'

const event = {} as unknown as H3Event

const PENDING_ROW = {
  id: '00000000-0000-0000-0000-000000000001',
  branchId: '00000000-0000-0000-0000-000000000002',
  contactName: 'Juan',
  contactPhone: '8112345678',
  partySize: 4,
  reservationDate: '2099-12-31',
  reservationTime: '19:30:00',
  status: 'pending',
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}
const CANCELLED_ROW = {
  ...PENDING_ROW,
  status: 'cancelled',
  deletedAt: new Date(),
}

describe('PATCH /api/v1/reservations/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('updates status to confirmed and returns 200', async () => {
    const updated = { ...PENDING_ROW, status: 'confirmed' }
    mockGetRouterParam.mockReturnValueOnce(PENDING_ROW.id)
    mockReadValidatedBody.mockResolvedValueOnce({ status: 'confirmed' })
    mockDb.select.mockReturnValueOnce(dbChain([PENDING_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([updated]))

    const result = await handler(event)

    expect(result).toEqual({ data: updated, error: null, meta: null })
  })

  it('updates notes only and leaves other fields unchanged', async () => {
    const updated = { ...PENDING_ROW, notes: 'New note' }
    mockGetRouterParam.mockReturnValueOnce(PENDING_ROW.id)
    mockReadValidatedBody.mockResolvedValueOnce({ notes: 'New note' })
    mockDb.select.mockReturnValueOnce(dbChain([PENDING_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([updated]))

    const result = await handler(event)

    expect(result.data).toMatchObject({ notes: 'New note', status: 'pending' })
  })

  it('throws 409 when reservation is cancelled', async () => {
    mockGetRouterParam.mockReturnValueOnce(CANCELLED_ROW.id)
    mockReadValidatedBody.mockResolvedValueOnce({ status: 'confirmed' })
    mockDb.select.mockReturnValueOnce(dbChain([CANCELLED_ROW]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 404 when reservation does not exist', async () => {
    mockGetRouterParam.mockReturnValueOnce(
      '00000000-0000-0000-0000-000000000099'
    )
    mockReadValidatedBody.mockResolvedValueOnce({ status: 'confirmed' })
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('schema rejects empty payload', async () => {
    const { UpdateReservationSchema } = await import(
      '../../../../types/reservations'
    )
    const result = UpdateReservationSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})
