import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { BranchPublicRow } from '@/types/branches'

// Stub all Nuxt globals
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
vi.stubGlobal('useRuntimeConfig', () => ({
  public: { mapboxToken: 'pk.test' },
}))
vi.stubGlobal('useSeoMeta', vi.fn())

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const BRANCHES_RESPONSE = {
  data: [
    {
      id: 'b1',
      name: 'SUMO Polanco',
      address: 'Masaryk 123',
      lat: '19.4326',
      lng: '-99.1924',
      isActive: true,
      type: 'ayce',
      schedule: null,
      phone: '+52551234567',
    } satisfies BranchPublicRow,
    {
      id: 'b2',
      name: 'SUMO Buenavista',
      address: 'Eje 1 Norte s/n',
      lat: '19.4498',
      lng: '-99.1503',
      isActive: true,
      type: 'express',
      schedule: null,
      phone: null,
    } satisfies BranchPublicRow,
  ],
  error: null,
  meta: null,
}

// Mock useMapProvider to avoid loading mapbox-gl
vi.mock('@/composables/maps/useMapProvider', () => ({
  useMapProvider: () => ({
    createMap: vi.fn().mockResolvedValue({}),
    addMarker: vi.fn(),
    removeMarker: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    flyTo: vi.fn(),
    destroy: vi.fn(),
  }),
}))

vi.mock('mapbox-gl', () => ({ default: {}, Map: vi.fn(), Marker: vi.fn() }))

import BranchCard from '@/features/branches/components/BranchCard.vue'
import BranchList from '@/features/branches/components/BranchList.vue'
import BranchSearch from '@/features/branches/components/BranchSearch.vue'
import BranchesPage from './branches.vue'

describe('branches.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(BRANCHES_RESPONSE)
  })

  it('calls fetchBranches (GET /api/v1/branches) on mount', async () => {
    mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/branches', { query: {} })
  })

  it('renders the BranchSearch component', () => {
    const wrapper = mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    expect(wrapper.findComponent(BranchSearch).exists()).toBe(true)
  })

  it('renders the BranchList component', () => {
    const wrapper = mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    expect(wrapper.findComponent(BranchList).exists()).toBe(true)
  })

  it('passes branches data to BranchList after fetch resolves', async () => {
    const wrapper = mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    await flushPromises()
    const list = wrapper.findComponent(BranchList)
    expect(list.props('branches')).toHaveLength(2)
  })

  it('updates highlightedBranchId when BranchList emits branch-select', async () => {
    const wrapper = mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    await flushPromises()
    const list = wrapper.findComponent(BranchList)
    await list.vm.$emit('branch-select', 'b1')
    await wrapper.vm.$nextTick()
    expect(list.props('highlightedId')).toBe('b1')
  })

  it('shows the map container', () => {
    const wrapper = mount(BranchesPage, {
      global: { components: { BranchSearch, BranchList, BranchCard } },
    })
    expect(wrapper.find('[data-testid="map-panel"]').exists()).toBe(true)
  })
})
