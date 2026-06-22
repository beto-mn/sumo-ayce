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

const BRANCHES_RESPONSE = { data: [POLANCO_ROW, BUENAVISTA_ROW] }
const BRANCHES_RESPONSE_ALL = { data: [BUENAVISTA_ROW, POLANCO_ROW] }

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
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE_ALL)

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

  it('requestGeolocation sorts branches by geo distance on success', async () => {
    const { useBranches } = await import('./useBranches')

    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: (success: PositionCallback) => {
          success({
            // Near Buenavista (19.4498, -99.1503), so Buenavista should come first
            coords: { latitude: 19.4498, longitude: -99.1503, accuracy: 10 },
            timestamp: Date.now(),
          } as GeolocationPosition)
        },
      },
      configurable: true,
    })

    const { fetchBranches, requestGeolocation, geoState, sortedBranches } =
      useBranches()
    // Pre-load branches without API call from geo
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE)
    await fetchBranches()

    await requestGeolocation()

    expect(geoState.value.status).toBe('success')
    expect(geoState.value.userLat).toBe(19.4498)
    // sortedBranches should be sorted: Buenavista (nearer) first, Polanco second
    expect(sortedBranches.value[0]?.id).toBe('b1')
    expect(sortedBranches.value[1]?.id).toBe('p1')
    // No extra API call — geo only sets userCoords, no fetchBranches call
    expect(mockFetch).toHaveBeenCalledOnce()
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

    // Only the Mapbox geocoding call (no branches API call for CP in new design)
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })

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

    const { geocodePostalCode, requestGeolocation, activeCpBadge } =
      useBranches()
    await geocodePostalCode('11560')
    expect(activeCpBadge.value).toBe('11560')

    // Trigger geo — should NOT override CP
    await requestGeolocation()
    expect(activeCpBadge.value).toBe('11560')
    // Only the Mapbox geocoding call — no branches API call
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  // ── geocodePostalCode ────────────────────────────────────────────────────────

  it('calls Mapbox Geocoding API with correct URL on CP submit', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })

    const { geocodePostalCode } = useBranches()
    await geocodePostalCode('11560')

    expect(mockFetch).toHaveBeenCalledOnce()
    const url = mockFetch.mock.calls[0]?.[0] as string
    expect(url).toContain('11560')
    expect(url).toContain('country=MX')
    expect(url).toContain('types=postcode')
  })

  it('sets activeCpBadge and clears cpState.value after successful CP search', async () => {
    const { useBranches } = await import('./useBranches')
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })

    const { geocodePostalCode, activeCpBadge, cpState } = useBranches()
    await geocodePostalCode('11560')

    expect(activeCpBadge.value).toBe('11560')
    expect(cpState.value.value).toBe('')
    expect(cpState.value.status).toBe('idle')
  })

  it('geocodePostalCode sorts branches by CP distance', async () => {
    const { useBranches } = await import('./useBranches')

    const { fetchBranches, geocodePostalCode, sortedBranches } = useBranches()
    // Pre-load branches; Buenavista is first in the raw list
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE_ALL)
    await fetchBranches()

    // Geocode to near Polanco (19.4326, -99.1924)
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })
    await geocodePostalCode('11560')

    // sortedBranches should put Polanco (nearer to 19.4326,-99.1924) first
    expect(sortedBranches.value[0]?.id).toBe('p1')
    expect(sortedBranches.value[1]?.id).toBe('b1')
    // Only the fetchBranches call + Mapbox call — no extra branches API call
    expect(mockFetch).toHaveBeenCalledTimes(2)
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

  it('clearCpSearch reverts to unsorted list when no geo active', async () => {
    const { useBranches } = await import('./useBranches')

    const {
      fetchBranches,
      geocodePostalCode,
      clearCpSearch,
      activeCpBadge,
      branches,
      sortedBranches,
    } = useBranches()
    // Pre-load branches
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE_ALL)
    await fetchBranches()

    // Setup: CP search (only Mapbox geocode, no branches call)
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })
    await geocodePostalCode('11560')
    expect(activeCpBadge.value).toBe('11560')

    await clearCpSearch()
    expect(activeCpBadge.value).toBeNull()

    // With no geo active, sortedBranches returns the raw branches list
    expect(sortedBranches.value).toBe(branches.value)
    // No extra API call after clear
    expect(mockFetch).toHaveBeenCalledTimes(2)
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

    // fetchBranches call + Mapbox geocode call
    mockFetch.mockResolvedValueOnce(BRANCHES_RESPONSE)
    mockFetch.mockResolvedValueOnce({
      features: [{ center: [-99.1924, 19.4326] }],
    })

    const {
      fetchBranches,
      requestGeolocation,
      geocodePostalCode,
      clearCpSearch,
      sortedBranches,
    } = useBranches()
    await fetchBranches()
    await requestGeolocation()
    // After geo, Buenavista should be first
    expect(sortedBranches.value[0]?.id).toBe('b1')

    await geocodePostalCode('11560')
    // After CP (near Polanco), Polanco should be first
    expect(sortedBranches.value[0]?.id).toBe('p1')

    await clearCpSearch()
    // After clearing CP, geo sort is restored — Buenavista first again
    expect(sortedBranches.value[0]?.id).toBe('b1')
    // Only 2 API calls total: fetchBranches + Mapbox geocode
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
