import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  makeTestMarker,
  mockMapboxAdapter,
  resetMapboxMocks,
} from '../../../tests/mocks/mapbox'
import type { MapMarker } from '../../composables/maps/types'

// Stub Nuxt globals needed by MapView
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { mapboxAccessToken: 'pk.test-token' },
}))

// Mock useMapProvider to return our stub adapter
vi.mock('../../composables/maps/useMapProvider', () => ({
  useMapProvider: () => mockMapboxAdapter,
}))

// Prevent real mapbox-gl from loading
vi.mock('mapbox-gl', () => ({
  default: {},
  Map: vi.fn(),
  Marker: vi.fn(),
  Popup: vi.fn(),
}))

import MapView from './MapView.vue'

describe('MapView', () => {
  beforeEach(() => {
    resetMapboxMocks()
  })

  it('mounts without throwing when adapter resolves', async () => {
    const wrapper = mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers: [],
      },
    })
    await wrapper.vm.$nextTick()
    expect(wrapper.exists()).toBe(true)
  })

  it('calls createMap with correct center and zoom on mount', async () => {
    mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 11,
        markers: [],
      },
    })
    // Wait for async createMap
    await new Promise(r => setTimeout(r, 0))
    expect(mockMapboxAdapter.createMap).toHaveBeenCalledOnce()
    const callArgs = mockMapboxAdapter.createMap.mock.calls[0]?.[1]
    expect(callArgs.center).toEqual([-99.1332, 19.4326])
    expect(callArgs.zoom).toBe(11)
  })

  it('calls addMarker once per marker after map is created', async () => {
    const markers: MapMarker[] = [
      makeTestMarker({ id: 'b1', color: 'orange' }),
      makeTestMarker({ id: 'b2', color: 'blue' }),
    ]

    mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers,
      },
    })
    await new Promise(r => setTimeout(r, 0))

    expect(mockMapboxAdapter.addMarker).toHaveBeenCalledTimes(2)
  })

  it('emits marker-click when a marker onClick fires', async () => {
    let capturedOnClick: ((m: MapMarker) => void) | undefined

    mockMapboxAdapter.addMarker.mockImplementation(
      (_map: unknown, marker: MapMarker) => {
        capturedOnClick = marker.onClick
      }
    )

    const markers: MapMarker[] = [makeTestMarker({ id: 'click-branch' })]

    const wrapper = mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers,
      },
    })
    await new Promise(r => setTimeout(r, 0))

    // Trigger the onClick callback the adapter received
    const firstMarker = markers[0]
    if (capturedOnClick && firstMarker) capturedOnClick(firstMarker)

    expect(wrapper.emitted('marker-click')).toBeTruthy()
    expect(wrapper.emitted('marker-click')?.[0]).toEqual(['click-branch'])
  })

  it('shows fallback slot when adapter createMap throws', async () => {
    mockMapboxAdapter.createMap.mockRejectedValueOnce(
      new Error('Invalid token')
    )

    const wrapper = mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers: [],
      },
      slots: {
        fallback: '<p>Mapa no disponible</p>',
      },
    })
    await new Promise(r => setTimeout(r, 10))

    expect(wrapper.html()).toContain('Mapa no disponible')
  })

  it('has a descriptive aria-label on the map container', () => {
    const wrapper = mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers: [],
      },
    })
    const mapContainer = wrapper.find('[aria-label]')
    expect(mapContainer.exists()).toBe(true)
    expect(mapContainer.attributes('aria-label')).toBeTruthy()
  })

  it('calls fitBounds after markers are synced on mount', async () => {
    const markers: MapMarker[] = [
      makeTestMarker({ id: 'b1', color: 'orange' }),
      makeTestMarker({ id: 'b2', color: 'blue' }),
    ]

    mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers,
      },
    })
    await new Promise(r => setTimeout(r, 0))

    expect(mockMapboxAdapter.fitBounds).toHaveBeenCalledOnce()
  })

  it('calls destroy on unmount', async () => {
    const wrapper = mount(MapView, {
      props: {
        center: [-99.1332, 19.4326] as [number, number],
        zoom: 12,
        markers: [],
      },
    })
    await new Promise(r => setTimeout(r, 0))
    wrapper.unmount()
    expect(mockMapboxAdapter.destroy).toHaveBeenCalledOnce()
  })
})
