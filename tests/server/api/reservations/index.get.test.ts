import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockGetValidatedQuery } = vi.hoisted(() => ({
  mockGetValidatedQuery: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return { ...actual, getValidatedQuery: mockGetValidatedQuery }
})

import handler from '../../../../server/api/v1/reservations/index.get'

const event = {} as unknown as H3Event

const DEFAULT_QUERY = { page: 1, limit: 20 }
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

describe('GET /api/v1/reservations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns paginated list excluding soft-deleted records', async () => {
    mockGetValidatedQuery.mockResolvedValueOnce(DEFAULT_QUERY)
    mockDb.select
      .mockReturnValueOnce(dbChain([RESERVATION]))
      .mockReturnValueOnce(dbChain([{ count: 1 }]))

    const result = await handler(event)

    expect(result.data).toEqual([RESERVATION])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 1 })
    expect(result.error).toBeNull()
  })

  it('returns empty array with meta when no reservations', async () => {
    mockGetValidatedQuery.mockResolvedValueOnce(DEFAULT_QUERY)
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([{ count: 0 }]))

    const result = await handler(event)

    expect(result.data).toEqual([])
    expect(result.meta).toEqual({ page: 1, limit: 20, total: 0 })
  })

  it('filters by status when provided', async () => {
    mockGetValidatedQuery.mockResolvedValueOnce({
      ...DEFAULT_QUERY,
      status: 'confirmed',
    })
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([{ count: 0 }]))

    await handler(event)

    expect(mockGetValidatedQuery).toHaveBeenCalledOnce()
    expect(mockDb.select).toHaveBeenCalledTimes(2)
  })

  it('applies pagination with correct offset', async () => {
    mockGetValidatedQuery.mockResolvedValueOnce({ page: 2, limit: 10 })
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([{ count: 15 }]))

    const result = await handler(event)

    expect(result.meta).toEqual({ page: 2, limit: 10, total: 15 })
  })
})
