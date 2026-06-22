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

  // Persisted geo coords — survives a CP search so we can revert to geo sort on badge clear
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

  // ── Private helpers ────────────────────────────────────────────────────────

  function applyGeoSuccess(lat: number, lng: number): void {
    geoCoords.value = { lat, lng }
    activeCpBadge.value = null
    cpState.value = { value: '', status: 'idle', errorMessage: null }
    geoState.value = {
      status: 'success',
      errorMessage: null,
      userLat: lat,
      userLng: lng,
    }
  }

  function applyGeoError(): void {
    geoState.value = {
      ...geoState.value,
      status: 'error',
      errorMessage: 'branches.search.geoError',
    }
  }

  function buildGeocodingUrl(cp: string, token: string): string {
    return `${GEOCODING_BASE}/${encodeURIComponent(cp)}.json?country=MX&types=postcode&access_token=${token}`
  }

  function applyCpSuccess(cp: string): void {
    activeCpBadge.value = cp
    cpState.value = { value: '', status: 'idle', errorMessage: null }
  }

  function applyCpError(cp: string): void {
    cpState.value = {
      value: cp,
      status: 'error',
      errorMessage: 'branches.search.cpError',
    }
  }

  // ── Public functions ───────────────────────────────────────────────────────

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
          const { latitude: lat, longitude: lng } = position.coords
          applyGeoSuccess(lat, lng)
          await fetchBranches(lat, lng)
          resolve()
        },
        _error => {
          applyGeoError()
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
        ? useRuntimeConfig().public?.mapboxAccessToken
        : '') ?? ''
    const url = buildGeocodingUrl(cp, token as string)
    try {
      const data = await $fetch<{
        features: Array<{ center: [number, number] }>
      }>(url)
      const firstFeature = data.features[0]
      if (!firstFeature) {
        applyCpError(cp)
        return
      }
      const [lng, lat] = firstFeature.center
      geoState.value = {
        status: detectGeoSupport(),
        errorMessage: null,
        userLat: null,
        userLng: null,
      }
      await fetchBranches(lat, lng)
      applyCpSuccess(cp)
    } catch {
      applyCpError(cp)
    }
  }

  async function clearCpSearch(): Promise<void> {
    activeCpBadge.value = null
    cpState.value = { value: '', status: 'idle', errorMessage: null }
    if (geoCoords.value) {
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
    await fetchBranches()
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
