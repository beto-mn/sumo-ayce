import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import type { FullMenuResult } from '@/types/menu'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('$fetch', vi.fn())

let routeQuery: Record<string, string> = {}
vi.stubGlobal('useRoute', () => ({ query: routeQuery }))

const mockData = ref<FullMenuResult | undefined>(undefined)
const mockError = ref<Error | null>(null)
const mockStatus = ref<'idle' | 'pending' | 'success' | 'error'>('pending')

// Stub useAsyncData with test-controlled refs, mirroring the shape the page
// destructures (data/error/status) without invoking the real $fetch fetcher.
vi.stubGlobal('useAsyncData', async () => ({
  data: mockData,
  error: mockError,
  status: mockStatus,
}))

const EMPTY_MENU: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [],
  drinkGroups: [],
}
const REAL_MENU: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [
    {
      key: 'appetizers',
      name: { es: 'Entradas', en: 'Appetizers' },
      note: null,
      displayOrder: 0,
      dishes: [],
    },
  ],
  drinkGroups: [],
}

import MenuPage from './menu.vue'

const stubs = {
  MenuSkeleton: {
    props: ['selection', 'modality'],
    template:
      '<div data-testid="menu-skeleton" :data-selection="selection" :data-modality="modality" />',
  },
  MenuShell: {
    props: ['menuData', 'initialSelection', 'initialModality'],
    template: '<div data-testid="menu-shell" />',
  },
}

function mountPage() {
  const Wrapper = defineComponent({
    components: { MenuPage },
    template: '<Suspense><MenuPage /></Suspense>',
  })
  return mount(Wrapper, { global: { stubs } })
}

describe('menu.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    routeQuery = {}
    mockData.value = undefined
    mockError.value = null
    mockStatus.value = 'pending'
  })

  it('renders MenuSkeleton (not MenuShell or the error message) on a fresh cold load with nothing cached', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const skeleton = wrapper.find('[data-testid="menu-skeleton"]')
    expect(skeleton.exists()).toBe(true)
    expect(skeleton.attributes('data-selection')).toBe('ayce')
    expect(skeleton.attributes('data-modality')).toBe('buffet')
    expect(wrapper.find('[data-testid="menu-shell"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('menu.unavailable')
  })

  it('renders MenuSkeleton while pending during a type/modality switch (stale content never shown)', async () => {
    routeQuery = { type: 'express' }
    mockStatus.value = 'pending'
    const wrapper = mountPage()
    await flushPromises()
    const skeleton = wrapper.find('[data-testid="menu-skeleton"]')
    expect(skeleton.attributes('data-selection')).toBe('express')
    expect(wrapper.find('[data-testid="menu-shell"]').exists()).toBe(false)
  })

  it('renders MenuShell once the fetch resolves with real content', async () => {
    mockStatus.value = 'success'
    mockData.value = REAL_MENU
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="menu-shell"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="menu-skeleton"]').exists()).toBe(false)
  })

  it('gives error/unavailable precedence over a stale pending status', async () => {
    mockStatus.value = 'pending'
    mockError.value = new Error('network failure')
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('menu.unavailable')
    expect(wrapper.find('[data-testid="menu-skeleton"]').exists()).toBe(false)
  })

  it('gives the unavailable (empty-degraded) state precedence over a stale pending status', async () => {
    mockStatus.value = 'pending'
    mockData.value = EMPTY_MENU
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.text()).toContain('menu.unavailable')
    expect(wrapper.find('[data-testid="menu-skeleton"]').exists()).toBe(false)
  })
})
