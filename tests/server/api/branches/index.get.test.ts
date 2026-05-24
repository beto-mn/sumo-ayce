import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

import handler from '../../../../server/api/branches/index.get'

const event = {} as unknown as H3Event

describe('GET /api/branches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns only active branches sorted by name', async () => {
    const rows = [
      {
        id: 'uuid-1',
        name: 'Centro',
        address: 'Av. Centro 1',
        postalCode: '64000',
      },
      {
        id: 'uuid-2',
        name: 'Del Valle',
        address: 'Av. Valle 2',
        postalCode: null,
      },
    ]
    mockDb.select.mockReturnValueOnce(dbChain(rows))

    const result = await handler(event)

    expect(result).toEqual({ data: rows, error: null, meta: null })
    expect(mockDb.select).toHaveBeenCalledOnce()
  })

  it('returns empty array when no active branches exist', async () => {
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result).toEqual({ data: [], error: null, meta: null })
  })

  it('response shape matches contract', async () => {
    const rows = [
      {
        id: 'uuid-1',
        name: 'SUMO Monterrey',
        address: 'Av. Test',
        postalCode: null,
      },
    ]
    mockDb.select.mockReturnValueOnce(dbChain(rows))

    const result = await handler(event)

    expect(result).toHaveProperty('data')
    expect(result).toHaveProperty('error', null)
    expect(result).toHaveProperty('meta', null)
    expect(result.data[0]).toMatchObject({
      id: expect.any(String),
      name: expect.any(String),
      address: expect.any(String),
    })
  })
})
