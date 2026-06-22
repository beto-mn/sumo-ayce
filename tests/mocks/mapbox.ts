/**
 * Centralized mapbox-gl mock for all test files.
 * Import in vitest config or per-test with vi.mock('mapbox-gl', ...).
 * Gate IV.6: No ad-hoc vi.mock('mapbox-gl') scattered across test files.
 */
import { vi } from 'vitest'
import type { MapMarker } from '../../app/composables/maps/types'

export const mockMarkerElement = document.createElement('div')

/** Minimal stub that satisfies the MapAdapter contract */
export const mockMapboxAdapter = {
  createMap: vi.fn().mockResolvedValue({ __isMap: true }),
  addMarker: vi.fn(),
  removeMarker: vi.fn(),
  setCenter: vi.fn(),
  setZoom: vi.fn(),
  flyTo: vi.fn(),
  destroy: vi.fn(),
}

/** Reset all mock function call histories between tests */
export function resetMapboxMocks() {
  for (const fn of Object.values(mockMapboxAdapter)) {
    if (typeof fn.mockReset === 'function') fn.mockReset()
  }
  mockMapboxAdapter.createMap.mockResolvedValue({ __isMap: true })
}

/** Creates a mock MapMarker for use in tests */
export function makeTestMarker(overrides: Partial<MapMarker> = {}): MapMarker {
  return {
    id: 'test-branch-1',
    position: [-99.1332, 19.4326],
    color: 'orange',
    ...overrides,
  }
}
