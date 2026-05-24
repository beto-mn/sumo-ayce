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

import handler from '../../../../server/api/reservations/[id].delete'

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

describe('DELETE /api/reservations/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('cancels reservation and returns 200 with deletedAt set', async () => {
    const cancelledResult = {
      ...PENDING_ROW,
      status: 'cancelled',
      deletedAt: new Date(),
    }
    mockGetRouterParam.mockReturnValueOnce(PENDING_ROW.id)
    mockDb.select.mockReturnValueOnce(dbChain([PENDING_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([cancelledResult]))

    const result = await handler(event)

    expect(result.data.status).toBe('cancelled')
    expect(result.data.deletedAt).not.toBeNull()
    expect(result.error).toBeNull()
  })

  it('record still has status cancelled after soft-delete', async () => {
    const cancelledResult = {
      ...PENDING_ROW,
      status: 'cancelled',
      deletedAt: new Date(),
    }
    mockGetRouterParam.mockReturnValueOnce(PENDING_ROW.id)
    mockDb.select.mockReturnValueOnce(dbChain([PENDING_ROW]))
    mockDb.update.mockReturnValueOnce(dbChain([cancelledResult]))

    const result = await handler(event)

    expect(result.data.id).toBe(PENDING_ROW.id)
    expect(result.data.status).toBe('cancelled')
  })

  it('throws 409 when reservation is already cancelled', async () => {
    mockGetRouterParam.mockReturnValueOnce(CANCELLED_ROW.id)
    mockDb.select.mockReturnValueOnce(dbChain([CANCELLED_ROW]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('throws 404 when reservation does not exist', async () => {
    mockGetRouterParam.mockReturnValueOnce(
      '00000000-0000-0000-0000-000000000099'
    )
    mockDb.select.mockReturnValueOnce(dbChain([]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 })
  })
})
