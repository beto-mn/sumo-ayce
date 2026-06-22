import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Stub Nuxt $fetch global
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Stub Nuxt globals
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { mapboxAccessToken: 'pk.test-token' },
}))

const POLANCO_ROW = {
  id: 'p1',
  name: 'SUMO Polanco',
  address: 'Masaryk 123',
  lat: '19.4326',
  lng: '-99.1924',
  isActive: true,
  type: 'ayce' as const,
  schedule: null,
  phone: '+52551234567',
  distanceKm: 1.23,
}

const BUENAVISTA_ROW = {
  id: 'b1',
  name: 'SUMO Buenavista',
  address: 'Eje 1 Norte s/n',
  lat: '19.4498',
  lng: '-99.1503',
  isActive: true,
  type: 'express' as const,
  schedule: null,
  phone: null,
}

// Default order: Polanco first, Buenavista second
const BRANCHES_RESPONSE = { data: [POLANCO_ROW, BUENAVISTA_ROW] }
// Reversed order: Buenavista first (simulates server sort near Buenavista)
const BRANCHES_NEAR_BUENAVISTA = { data: [BUENAVISTA_ROW, POLANCO_ROW] }
// Polanco first (simulates server sort near Polanco / CP 11560)
const BRANCHES_NEAR_POLANCO = { data: [POLANCO_ROW, BUENAVISTA_ROW] }

const MAPBOX_NEAR_POLANCO = { features: [{ center: [-99.1924, 19.4326] }] }

describe('useBranches', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      configurable: true,
    })
  })

  // ── fetchBranches ────────────────────────────────────────────────────────────

  it('fetchBranches without coords calls API without query params', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE)

    const { fetchBranches, branches } = useBranches()
    await fetchBranches()

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, opts] = mockFetch.mock.calls[0] as [
      string,
      { query: Record<string, unknown> },
    ]
    expect(url).toBe('/api/v1/branches')
    expect(opts.query).toEqual({})
    expect(branches.value).toHaveLength(2)
  })

  it('fetchBranches with coords passes lat/lng as query', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE)

    const { fetchBranches, branches } = useBranches()
    await fetchBranches(19.4326, -99.1924)

    const [, opts] = mockFetch.mock.calls[0] as [
      string,
      { query: Record<string, unknown> },
    ]
    expect(opts.query).toEqual({ lat: 19.4326, lng: -99.1924 })
    expect(branches.value).toHaveLength(2)
  })

  it('sets isLoading to false after fetchBranches resolves', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE)

    const { fetchBranches, isLoading } = useBranches()
    await fetchBranches()
    expect(isLoading.value).toBe(false)
  })

  it('sets branches to [] on fetchBranches error', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { fetchBranches, branches } = useBranches()
    await fetchBranches()
    expect(branches.value).toEqual([])
  })

  // ── geolocation ──────────────────────────────────────────────────────────────

  it('sets geoState to unsupported when navigator.geolocation is not available', async () => {
    const { useBranches } = await import('./useBranches')
    const { geoState } = useBranches()
    expect(geoState.value.status).toBe('unsupported')
  })

  it('requestGeolocation fetches branches with coords and returns them sorted', async () => {
    const { useBranches } = await import('./useBranches')

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            // Near Buenavista (19.4498, -99.1503)
            coords: { latitude: 19.4498, longitude: -99.1503, accuracy: 10 },
            timestamp: Date.now(),
          } as GeolocationPosition)
        },
      },
      configurable: true,
    })

    // Initial load + geo API call (server returns Buenavista first)
    mockFetch
      .mockResolvedValueOnce(BRANCHES_RESPONSE)
      .mockResolvedValueOnce(BRANCHES_NEAR_BUENAVISTA)

    const { fetchBranches, requestGeolocation, geoState, branches } =
      useBranches()
    await fetchBranches()
    await requestGeolocation()

    expect(geoState.value.status).toBe('success')
    expect(geoState.value.userLat).toBe(19.4498)
    // API returned Buenavista (nearer) first
    expect(branches.value[0]?.id).toBe('b1')
    expect(branches.value[1]?.id).toBe('p1')
    // Initial load + geo fetchBranches(lat, lng)
    expect(mockFetch).toHaveBeenCalledTimes(2)
    // Second call passes coordinates
    const [, opts] = mockFetch.mock.calls[1] as [
      string,
      { query: Record<string, unknown> },
    ]
    expect(opts.query).toEqual({ lat: 19.4498, lng: -99.1503 })
  })

  it('sets geoState to error when geolocation is denied', async () => {
    const { useBranches } = await import('./useBranches')

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (
          _s: PositionCallback,
          error: PositionErrorCallback
        ) => {
          error({
            code: 1,
            message: 'User denied',
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          } as GeolocationPositionError)
        },
      },
      configurable: true,
    })

    const { requestGeolocation, geoState } = useBranches()
    await requestGeolocation()

    expect(geoState.value.status).toBe('error')
    expect(geoState.value.errorMessage).toBeTruthy()
  })

  it('sets geoState to loading while geolocation is resolving', async () => {
    const { useBranches } = await import('./useBranches')
    let resolveGeo: ((p: GeolocationPosition) => void) | undefined
    const geoPromise = new Promise<GeolocationPosition>(res => {
      resolveGeo = res
    })

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (s: PositionCallback) => {
          geoPromise.then(s)
        },
      },
      configurable: true,
    })

    // Mock the fetchBranches call that happens after geo success
    mockFetch.mockResolvedValueOnce(BRANCHES_NEAR_BUENAVISTA)

    const { requestGeolocation, geoState } = useBranches()

    const promise = requestGeolocation()
    expect(geoState.value.status).toBe('loading')

    resolveGeo?.({
      coords: { latitude: 19.4326, longitude: -99.1332, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition)

    await promise
    expect(geoState.value.status).toBe('success')
  })

  it('does NOT re-fetch by geo if a CP badge is already active', async () => {
    const { useBranches } = await import('./useBranches')

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            coords: { latitude: 19.4498, longitude: -99.1503, accuracy: 10 },
            timestamp: Date.now(),
          } as GeolocationPosition)
        },
      },
      configurable: true,
    })

    // geocodePostalCode makes 2 calls: Mapbox geocode + branches API
    mockFetch
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO)
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO)

    const { geocodePostalCode, requestGeolocation, activeCpBadge } =
      useBranches()
    await geocodePostalCode('11560')
    expect(activeCpBadge.value).toBe('11560')

    // Trigger geo — should NOT override CP (early return)
    await requestGeolocation()
    expect(activeCpBadge.value).toBe('11560')
    // Exactly 2 calls: Mapbox geocode + branches with CP coords; geo made no calls
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  // ── geocodePostalCode ────────────────────────────────────────────────────────

  it('calls Mapbox Geocoding API with correct URL on CP submit', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO)
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO)

    const { geocodePostalCode } = useBranches()
    await geocodePostalCode('11560')

    // First call is the Mapbox geocoding URL
    const url = mockFetch.mock.calls[0]?.[0] as string
    expect(url).toContain('11560')
    expect(url).toContain('country=MX')
    expect(url).toContain('types=postcode')
  })

  it('sets activeCpBadge and clears cpState.value after successful CP search', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO)
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO)

    const { geocodePostalCode, activeCpBadge, cpState } = useBranches()
    await geocodePostalCode('11560')

    expect(activeCpBadge.value).toBe('11560')
    expect(cpState.value.value).toBe('')
    expect(cpState.value.status).toBe('idle')
  })

  it('geocodePostalCode fetches branches with coords and updates list', async () => {
    const { useBranches } = await import('./useBranches')

    const { fetchBranches, geocodePostalCode, branches } = useBranches()
    // Initial load: Buenavista first (alphabetical)
    mockFetch.mockResolvedValueOnce({ data: [BUENAVISTA_ROW, POLANCO_ROW] })
    await fetchBranches()

    // Geocode CP 11560 (near Polanco) → server returns Polanco first
    mockFetch
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO)
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO)
    await geocodePostalCode('11560')

    // branches.value reflects server-sorted response (Polanco nearer to 11560)
    expect(branches.value[0]?.id).toBe('p1')
    expect(branches.value[1]?.id).toBe('b1')
    // 3 calls: initial fetchBranches + Mapbox geocode + fetchBranches with coords
    expect(mockFetch).toHaveBeenCalledTimes(3)
  })

  it('sets cpState to error when geocoding returns no features', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce({ features: [] })

    const { geocodePostalCode, cpState } = useBranches()
    await geocodePostalCode('99999')

    expect(cpState.value.status).toBe('error')
    expect(cpState.value.errorMessage).toBeTruthy()
  })

  it('sets cpState to error when geocoding API call fails', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    const { geocodePostalCode, cpState } = useBranches()
    await geocodePostalCode('11560')

    expect(cpState.value.status).toBe('error')
  })

  // ── clearCpSearch ────────────────────────────────────────────────────────────

  it('clearCpSearch re-fetches unsorted list when no geo active', async () => {
    const { useBranches } = await import('./useBranches')

    const {
      fetchBranches,
      geocodePostalCode,
      clearCpSearch,
      activeCpBadge,
      branches,
    } = useBranches()
    // Pre-load
    mockFetch.mockResolvedValueOnce({ data: [BUENAVISTA_ROW, POLANCO_ROW] })
    await fetchBranches()

    // CP search: Mapbox + branches with coords
    mockFetch
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO)
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO)
    await geocodePostalCode('11560')
    expect(activeCpBadge.value).toBe('11560')

    // Clear CP — no geo active → re-fetch without coords
    mockFetch.mockResolvedValueOnce({ data: [BUENAVISTA_ROW, POLANCO_ROW] })
    await clearCpSearch()
    expect(activeCpBadge.value).toBeNull()

    // Back to original unsorted order
    expect(branches.value[0]?.id).toBe('b1')
    // 4 calls: initial + geocode + branches(cp) + branches(unsorted)
    expect(mockFetch).toHaveBeenCalledTimes(4)
  })

  it('clearCpSearch restores geo-based sort when geo was active', async () => {
    const { useBranches } = await import('./useBranches')

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            // Near Buenavista
            coords: { latitude: 19.4498, longitude: -99.1503, accuracy: 10 },
            timestamp: Date.now(),
          } as GeolocationPosition)
        },
      },
      configurable: true,
    })

    mockFetch
      .mockResolvedValueOnce(BRANCHES_RESPONSE) // initial
      .mockResolvedValueOnce(BRANCHES_NEAR_BUENAVISTA) // geo fetchBranches
      .mockResolvedValueOnce(MAPBOX_NEAR_POLANCO) // CP geocode
      .mockResolvedValueOnce(BRANCHES_NEAR_POLANCO) // CP fetchBranches
      .mockResolvedValueOnce(BRANCHES_NEAR_BUENAVISTA) // clearCpSearch restores geo

    const {
      fetchBranches,
      requestGeolocation,
      geocodePostalCode,
      clearCpSearch,
      branches,
    } = useBranches()
    await fetchBranches()
    await requestGeolocation()
    expect(branches.value[0]?.id).toBe('b1') // geo: Buenavista first

    await geocodePostalCode('11560')
    expect(branches.value[0]?.id).toBe('p1') // CP: Polanco first

    await clearCpSearch()
    // Geo coords were persisted → re-fetches with geo coords → Buenavista first again
    expect(branches.value[0]?.id).toBe('b1')
    expect(mockFetch).toHaveBeenCalledTimes(5)
  })
})
