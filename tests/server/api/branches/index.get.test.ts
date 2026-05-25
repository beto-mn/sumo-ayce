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

import handler from '../../../../server/api/branches/index.get'

const event = {} as unknown as H3Event

// Branches at known distances from user at (19.4326, -99.1332)
// radii with defaults: buildRadii(5, 20) = [5, 8, 13, 20]
const BRANCH_AT_0KM = {
  id: 'b1',
  name: 'Alpha',
  address: 'Addr 1',
  lat: '19.43260000',
  lng: '-99.13320000',
  isActive: true,
}
const BRANCH_AT_3KM = {
  id: 'b2',
  name: 'Beta',
  address: 'Addr 2',
  lat: '19.40570000',
  lng: '-99.13320000',
  isActive: true,
}
const BRANCH_AT_10KM = {
  id: 'b3',
  name: 'Gamma',
  address: 'Addr 3',
  lat: '19.52240000',
  lng: '-99.13320000',
  isActive: true,
}
const BRANCH_AT_18KM = {
  id: 'b4',
  name: 'Delta',
  address: 'Addr 4',
  lat: '19.59430000',
  lng: '-99.13320000',
  isActive: true,
}
const BRANCH_NO_COORDS = {
  id: 'b5',
  name: 'Epsilon',
  address: 'Addr 5',
  lat: null,
  lng: null,
  isActive: true,
}

const INTERNAL_FIELDS = [
  'whatsappReservaciones',
  'whatsappReservacionesBackup',
  'createdAt',
  'updatedAt',
]

describe('GET /api/branches — with coordinates (US1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns branches within default radius with distanceKm and searchContext', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_AT_0KM, BRANCH_AT_3KM]))

    const result = await handler(event)

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).toHaveProperty('distanceKm')
    expect(result.data[0].distanceKm).toBe(0)
    expect(result.searchContext).toEqual({
      radiusUsed: 5,
      expanded: false,
      noResults: false,
    })
  })

  it('expands to intermediate radius when no results at default', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_AT_10KM]))

    const result = await handler(event)

    expect(result.data).toHaveLength(1)
    expect(result.searchContext.expanded).toBe(true)
    expect(result.searchContext.radiusUsed).toBeGreaterThan(5)
    expect(result.searchContext.noResults).toBe(false)
  })

  it('expands to max radius when only far branches exist', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_AT_18KM]))

    const result = await handler(event)

    expect(result.data).toHaveLength(1)
    expect(result.searchContext.radiusUsed).toBe(20)
    expect(result.searchContext.expanded).toBe(true)
    expect(result.searchContext.noResults).toBe(false)
  })

  it('returns empty data with noResults=true when no branches in any radius', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result.data).toEqual([])
    expect(result.searchContext).toEqual({
      radiusUsed: 20,
      expanded: true,
      noResults: true,
    })
  })

  it('sorts results by distanceKm ascending', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_AT_3KM, BRANCH_AT_0KM]))

    const result = await handler(event)

    expect(result.data[0].distanceKm).toBeLessThanOrEqual(
      result.data[1].distanceKm
    )
  })

  it('excludes branches without lat/lng from distance results', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(
      dbChain([BRANCH_AT_0KM, BRANCH_NO_COORDS])
    )

    const result = await handler(event)

    expect(
      result.data.every((b: { id: string }) => b.id !== BRANCH_NO_COORDS.id)
    ).toBe(true)
  })

  it('does not expose internal fields in response', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-99.1332' })
    mockDb.select.mockReturnValueOnce(
      dbChain([
        {
          ...BRANCH_AT_0KM,
          whatsappReservaciones: '+521234567890',
          whatsappReservacionesBackup: '+521234567891',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    )

    const result = await handler(event)

    for (const field of INTERNAL_FIELDS) {
      expect(result.data[0]).not.toHaveProperty(field)
    }
  })

  it('returns 400 when lat is provided without lng', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when lng is provided without lat', async () => {
    mockGetQuery.mockReturnValue({ lng: '-99.1332' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when lat is out of valid range', async () => {
    mockGetQuery.mockReturnValue({ lat: '999', lng: '-99.1332' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when lng is out of valid range', async () => {
    mockGetQuery.mockReturnValue({ lat: '19.4326', lng: '-999' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when radius is 0', async () => {
    mockGetQuery.mockReturnValue({
      lat: '19.4326',
      lng: '-99.1332',
      radius: '0',
    })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })

  it('returns 400 when lat is non-numeric', async () => {
    mockGetQuery.mockReturnValue({ lat: 'abc', lng: '-99.1332' })
    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})

describe('GET /api/branches — without coordinates (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns all branches without distanceKm or searchContext', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([BRANCH_AT_0KM, BRANCH_AT_3KM]))

    const result = await handler(event)

    expect(result.data).toHaveLength(2)
    expect(result.data[0]).not.toHaveProperty('distanceKm')
    expect(result).not.toHaveProperty('searchContext')
    expect(result).toMatchObject({
      data: expect.any(Array),
      error: null,
      meta: null,
    })
  })

  it('includes branches without lat/lng in full list', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(
      dbChain([BRANCH_AT_0KM, BRANCH_NO_COORDS])
    )

    const result = await handler(event)

    expect(
      result.data.some((b: { id: string }) => b.id === BRANCH_NO_COORDS.id)
    ).toBe(true)
  })

  it('returns empty array when no active branches exist', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(event)

    expect(result).toEqual({ data: [], error: null, meta: null })
  })

  it('does not expose internal fields in full list response', async () => {
    mockGetQuery.mockReturnValue({})
    mockDb.select.mockReturnValueOnce(
      dbChain([
        {
          ...BRANCH_AT_0KM,
          whatsappReservaciones: '+521234567890',
          whatsappReservacionesBackup: '+521234567891',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    )

    const result = await handler(event)

    for (const field of INTERNAL_FIELDS) {
      expect(result.data[0]).not.toHaveProperty(field)
    }
  })
})
