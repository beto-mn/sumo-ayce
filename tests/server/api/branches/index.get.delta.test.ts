/**
 * Feature 013 delta tests: GET /api/v1/branches now exposes type, schedule, phone.
 * whatsappReservaciones and whatsappReservacionesBackup must NOT appear.
 */
import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockGetQuery } = vi.hoisted(() => ({
  mockGetQuery: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return { ...actual, getQuery: mockGetQuery }
})

import handler from '../../../../server/api/v1/branches/index.get'

const event = {} as unknown as H3Event

const BRANCH_WITH_NEW_FIELDS = {
  id: 'b1',
  name: 'SUMO Polanco',
  address: 'Av. Presidente Masaryk 123, Polanco',
  lat: '19.43260000',
  lng: '-99.19240000',
  isActive: true,
  type: 'ayce',
  schedule: { weekdays: { open: '12:00', close: '22:00' } },
  phone: '+52551234567',
  whatsappReservaciones: '+52551234567',
  whatsappReservacionesBackup: '+52551234568',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const BRANCH_MINIMAL = {
  id: 'b2',
  name: 'SUMO Express Buenavista',
  address: 'Eje 1 Norte s/n, Buenavista',
  lat: '19.44980000',
  lng: '-99.15030000',
  isActive: true,
  type: 'express',
  schedule: null,
  phone: null,
}

describe('GET /api/v1/branches — feature 013 delta (no coords)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes type field in response', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).toHaveProperty('type', 'ayce')
  })

  it('includes schedule field in response (may be null)', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(
      dbChain([BRANCH_WITH_NEW_FIELDS, BRANCH_MINIMAL])
    )

    const result = await handler(event)

    expect(result.data[0]).toHaveProperty('schedule')
    expect(result.data[1].schedule).toBeNull()
  })

  it('includes phone field (renamed from whatsappReservaciones)', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).toHaveProperty('phone', '+52551234567')
  })

  it('does NOT expose whatsappReservaciones in response', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).not.toHaveProperty('whatsappReservaciones')
  })

  it('does NOT expose whatsappReservacionesBackup in response', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).not.toHaveProperty('whatsappReservacionesBackup')
  })

  it('returns type ayce or express for each branch', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(
      dbChain([BRANCH_WITH_NEW_FIELDS, BRANCH_MINIMAL])
    )

    const result = await handler(event)

    for (const branch of result.data) {
      expect(['ayce', 'express']).toContain(branch.type)
    }
  })

  it('returns phone as null when branch has no phone', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_MINIMAL]))

    const result = await handler(event)

    expect(result.data[0].phone).toBeNull()
  })
})

describe('GET /api/v1/branches — feature 013 delta (with coords)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('includes type in distance-sorted response', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).toHaveProperty('type', 'ayce')
  })

  it('includes phone in distance-sorted response', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).toHaveProperty('phone', '+52551234567')
  })

  it('does NOT expose whatsappReservaciones in distance response', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_WITH_NEW_FIELDS]))

    const result = await handler(event)

    expect(result.data[0]).not.toHaveProperty('whatsappReservaciones')
  })
})
