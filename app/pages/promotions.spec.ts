import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'
import type { PromotionsResult } from '@/types/content'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (k: string) => k,
}))
vi.stubGlobal('useSeoMeta', vi.fn())
vi.stubGlobal('useLocalePath', () => (path: string) => path)

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

// Stub useAsyncData so the page's async setup resolves synchronously
vi.stubGlobal(
  'useAsyncData',
  async (_key: string, fetcher: () => Promise<unknown>) => {
    const result = await fetcher()
    return { data: ref(result) }
  }
)

const PROMO_RESPONSE: PromotionsResult = {
  ok: true,
  promotions: [
    {
      id: '1',
      badge: { es: 'Martes', en: 'Tuesday' },
      title: 'Martes 2x1',
      color: 'orange',
      type: 'ayce',
      active: true,
      publishedAt: '2026-06-01T00:00:00Z',
      imageDesktopUrl: 'https://cdn.example.com/promo.jpg',
      imageTabletUrl: null,
      imageMovilUrl: null,
    },
    {
      id: '2',
      badge: { es: 'Express', en: 'Express' },
      title: 'SUMO Express',
      color: 'blue',
      type: 'express',
      active: true,
      publishedAt: '2026-06-02T00:00:00Z',
      imageDesktopUrl: null,
      imageTabletUrl: null,
      imageMovilUrl: null,
    },
  ],
}

import PromotionsPage from './promotions.vue'

const stubs = {
  UiPageHeader: { props: ['badge', 'title', 'badgeTone'], template: '<div />' },
  UiPromotionsCarousel: {
    name: 'UiPromotionsCarousel',
    props: ['promotions'],
    template: '<div class="carousel-stub" :data-count="promotions.length" />',
  },
}

/** Mount PromotionsPage inside a Suspense boundary to support async setup. */
function mountPage() {
  const Wrapper = defineComponent({
    components: { PromotionsPage },
    template: '<Suspense><PromotionsPage /></Suspense>',
  })
  return mount(Wrapper, { global: { stubs } })
}

describe('promotions.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue(PROMO_RESPONSE)
  })

  it('fetches promotions from GET /api/v1/content/promotions?all=1', async () => {
    mountPage()
    await flushPromises()
    expect(mockFetch).toHaveBeenCalledWith('/api/v1/content/promotions?all=1')
  })

  it('renders the shared carousel with the fetched promotions', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const carousel = wrapper.find('.carousel-stub')
    expect(carousel.exists()).toBe(true)
    expect(carousel.attributes('data-count')).toBe('2')
  })

  it('shows the empty state (not the carousel) when ok=false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, promotions: [] })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.find('.carousel-stub').exists()).toBe(false)
  })

  it('shows the empty state when there are zero promotions', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, promotions: [] })
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
  })
})
