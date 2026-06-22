import { type Ref, ref } from 'vue'
import type { CpState, GeoState, SortedBranch } from '../types'

const GEOCODING_BASE = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

function detectGeoSupport(): GeoState['status'] {
  if (typeof navigator === 'undefined') return 'unsupported'
  return navigator.geolocation ? 'idle' : 'unsupported'
}

export interface UseBranchesReturn {
  branches: Ref<SortedBranch[]>
  isLoading: Ref<boolean>
  geoState: Ref<GeoState>
  cpState: Ref<CpState>
  activeCpBadge: Ref<string | null>
  highlightedBranchId: Ref<string | null>
  fetchBranches: (lat?: number, lng?: number) => Promise<void>
  requestGeolocation: () => Promise<void>
  geocodePostalCode: (cp: string) => Promise<void>
  clearCpSearch: () => Promise<void>
  clearGeoSearch: () => Promise<void>
}

export function useBranches(): UseBranchesReturn {
  const branches = ref<SortedBranch[]>([])
  const isLoading = ref(false)
  const highlightedBranchId = ref<string | null>(null)

  // Persisted geo coords — survives a CP search so we can revert to geo on badge clear
  const geoCoords = ref<{ lat: number; lng: number } | null>(null)

  const geoState = ref<GeoState>({
    status: detectGeoSupport(),
    errorMessage: null,
    userLat: null,
    userLng: null,
  })

  const cpState = ref<CpState>({
    value: '',
    status: 'idle',
    errorMessage: null,
  })

  const activeCpBadge = ref<string | null>(null)

  async function fetchBranches(lat?: number, lng?: number): Promise<void> {
    isLoading.value = true
    try {
      const query =
        lat != null && lng != null
          ? { lat, lng }
          : ({} as Record<string, unknown>)
      const response = await $fetch<{ data: SortedBranch[] }>(
        '/api/v1/branches',
        { query }
      )
      branches.value = response.data ?? []
    } catch {
      branches.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function requestGeolocation(): Promise<void> {
    if (geoState.value.status === 'unsupported') return
    // CP has priority — geo cannot override an active postal-code search
    if (activeCpBadge.value) return

    geoState.value = {
      ...geoState.value,
      status: 'loading',
      errorMessage: null,
    }

    return new Promise<void>(resolve => {
      navigator.geolocation.getCurrentPosition(
        async position => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          geoCoords.value = { lat, lng }
          // Geo activation clears any active CP
          activeCpBadge.value = null
          cpState.value = { value: '', status: 'idle', errorMessage: null }
          geoState.value = {
            status: 'success',
            errorMessage: null,
            userLat: lat,
            userLng: lng,
          }
          await fetchBranches(lat, lng)
          resolve()
        },
        _error => {
          geoState.value = {
            ...geoState.value,
            status: 'error',
            errorMessage: 'branches.search.geoError',
          }
          resolve()
        },
        { timeout: 10000 }
      )
    })
  }

  async function geocodePostalCode(cp: string): Promise<void> {
    cpState.value = { value: cp, status: 'loading', errorMessage: null }

    const token =
      (typeof useRuntimeConfig !== 'undefined'
        ? useRuntimeConfig().public?.mapboxToken
        : '') ?? ''
    const url = `${GEOCODING_BASE}/${encodeURIComponent(cp)}.json?country=MX&types=postcode&access_token=${token}`

    try {
      const data = await $fetch<{
        features: Array<{ center: [number, number] }>
      }>(url)
      const firstFeature = data.features[0]
      if (!firstFeature) {
        cpState.value = {
          value: cp,
          status: 'error',
          errorMessage: 'branches.search.cpError',
        }
        return
      }
      const [lng, lat] = firstFeature.center
      // CP takes over — clear geo badge (keep geoCoords for revert on clear)
      geoState.value = {
        status: detectGeoSupport(),
        errorMessage: null,
        userLat: null,
        userLng: null,
      }
      // Fetch sorted results, then set badge and clear input
      await fetchBranches(lat, lng)
      activeCpBadge.value = cp
      cpState.value = { value: '', status: 'idle', errorMessage: null }
    } catch (err) {
      console.error('[useBranches] geocodePostalCode error:', err)
      cpState.value = {
        value: cp,
        status: 'error',
        errorMessage: 'branches.search.cpError',
      }
    }
  }

  async function clearCpSearch(): Promise<void> {
    activeCpBadge.value = null
    cpState.value = { value: '', status: 'idle', errorMessage: null }
    if (geoCoords.value) {
      // Restore geo badge so the UI reflects what's being searched
      geoState.value = {
        status: 'success',
        errorMessage: null,
        userLat: geoCoords.value.lat,
        userLng: geoCoords.value.lng,
      }
      await fetchBranches(geoCoords.value.lat, geoCoords.value.lng)
    } else {
      await fetchBranches()
    }
  }

  async function clearGeoSearch(): Promise<void> {
    geoCoords.value = null
    geoState.value = {
      status: 'idle',
      errorMessage: null,
      userLat: null,
      userLng: null,
    }
    if (!activeCpBadge.value) {
      await fetchBranches()
    }
  }

  return {
    branches,
    isLoading,
    geoState,
    cpState,
    activeCpBadge,
    highlightedBranchId,
    fetchBranches,
    requestGeolocation,
    geocodePostalCode,
    clearCpSearch,
    clearGeoSearch,
  }
}
