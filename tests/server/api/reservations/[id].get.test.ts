import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockGetRouterParam } = vi.hoisted(() => ({
  mockGetRouterParam: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return { ...actual, getRouterParam: mockGetRouterParam }
})

import handler from '../../../../server/api/reservations/[id].get'

const event = {} as unknown as H3Event

const RESERVATION = {
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

describe('GET /api/reservations/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns reservation by UUID with 200', async () => {
    mockGetRouterParam.mockReturnValueOnce(RESERVATION.id)
    mockDb.select.mockReturnValueOnce(dbChain([RESERVATION]))

    const result = await handler(event)

    expect(result).toEqual({ data: RESERVATION, error: null, meta: null })
  })

  it('throws 404 when reservation does not exist', async () => {
    mockGetRouterParam.mockReturnValueOnce(
      '00000000-0000-0000-0000-000000000099'
    )
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })

  it('throws 404 when reservation is soft-deleted', async () => {
    const deletedReservation = {
      ...RESERVATION,
      deletedAt: new Date(),
      status: 'cancelled',
    }
    mockGetRouterParam.mockReturnValueOnce(deletedReservation.id)
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
