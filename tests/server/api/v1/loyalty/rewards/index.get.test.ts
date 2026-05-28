import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../../../mocks/db'

vi.mock('../../../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../../../mocks/db')
  return { db: mockDb }
})

vi.mock('../../../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import handler from '../../../../../../server/api/v1/loyalty/rewards/index.get'

const event = {} as unknown as H3Event

const ACTIVE_REWARD_1 = {
  id: 'r1',
  name: 'Refresco',
  description: 'Bebida gratis',
  pointsCost: 10,
}
const ACTIVE_REWARD_2 = {
  id: 'r2',
  name: 'Postre',
  description: null,
  pointsCost: 20,
}
const INACTIVE_REWARD = {
  id: 'r3',
  name: 'Combo',
  description: null,
  pointsCost: 5,
}

describe('GET /api/v1/loyalty/rewards', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns only active rewards', async () => {
    mockDb.select.mockReturnValueOnce(
      dbChain([ACTIVE_REWARD_1, ACTIVE_REWARD_2])
    )

    const result = await handler(event)

    expect(result.data).toHaveLength(2)
    expect(result.data.map((r: typeof ACTIVE_REWARD_1) => r.id)).not.toContain(
      INACTIVE_REWARD.id
    )
  })

  it('returns results ordered by pointsCost ascending', async () => {
    mockDb.select.mockReturnValueOnce(
      dbChain([ACTIVE_REWARD_1, ACTIVE_REWARD_2])
    )

    const result = await handler(event)

    expect(result.data[0].pointsCost).toBeLessThanOrEqual(
      result.data[1].pointsCost
    )
  })

  it('response includes name, description, pointsCost', async () => {
    mockDb.select.mockReturnValueOnce(dbChain([ACTIVE_REWARD_1]))

    const result = await handler(event)

    expect(result.data[0]).toMatchObject({
      id: ACTIVE_REWARD_1.id,
      name: ACTIVE_REWARD_1.name,
      description: ACTIVE_REWARD_1.description,
      pointsCost: ACTIVE_REWARD_1.pointsCost,
    })
  })

  it('returns empty array when no active rewards', async () => {
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result.data).toEqual([])
    expect(result.error).toBeNull()
  })
})
