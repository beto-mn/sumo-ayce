// app/composables/maps/useMapProvider.ts
import { mapboxAdapter } from './adapters/mapboxAdapter'
import type { MapAdapter } from './types'

/**
 * Returns the active map adapter.
 * Switching providers is a one-line change here (Article X — KISS).
 */
export function useMapProvider(): MapAdapter {
  return mapboxAdapter
}
