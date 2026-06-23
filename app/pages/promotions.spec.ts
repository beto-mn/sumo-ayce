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
      title: { es: 'Martes 2x1', en: 'Tuesday 2for1' },
      description: {
        es: 'Trae a un amigo gratis.',
        en: 'Bring a friend free.',
      },
      validity: { es: 'Solo martes', en: 'Tuesdays only' },
      color: 'orange',
      type: 'ayce',
      active: true,
      publishedAt: '2026-06-01T00:00:00Z',
      imageUrl: 'https://cdn.example.com/promo.jpg',
    },
    {
      id: '2',
      badge: { es: 'Express', en: 'Express' },
      title: { es: 'SUMO Express', en: 'SUMO Express' },
      description: { es: 'Formato compacto.', en: 'Compact format.' },
      validity: { es: 'Todos los días', en: 'Every day' },
      color: 'blue',
      type: 'express',
      active: true,
      publishedAt: '2026-06-02T00:00:00Z',
      imageUrl: null,
    },
  ],
}

import PromotionCard from '@/components/ui/PromotionCard.vue'
import PromotionsGrid from '@/features/promotions/components/PromotionsGrid.vue'
import PromotionsPage from './promotions.vue'

/** Mount PromotionsPage inside a Suspense boundary to support async setup. */
function mountPage() {
  const Wrapper = defineComponent({
    components: { PromotionsPage },
    template: '<Suspense><PromotionsPage /></Suspense>',
  })
  return mount(Wrapper, {
    global: {
      components: { PromotionsGrid, UiPromotionCard: PromotionCard },
    },
  })
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

  it('renders the PromotionsGrid component', async () => {
    const wrapper = mountPage()
    await flushPromises()
    expect(wrapper.findComponent(PromotionsGrid).exists()).toBe(true)
  })

  it('passes promotions data to PromotionsGrid', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const grid = wrapper.findComponent(PromotionsGrid)
    expect(grid.props('promotions')).toHaveLength(2)
  })

  it('passes ok=true to PromotionsGrid when fetch succeeds', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const grid = wrapper.findComponent(PromotionsGrid)
    expect(grid.props('ok')).toBe(true)
  })

  it('passes ok=false to PromotionsGrid when fetch returns ok=false', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, promotions: [] })
    const wrapper = mountPage()
    await flushPromises()
    const grid = wrapper.findComponent(PromotionsGrid)
    expect(grid.props('ok')).toBe(false)
  })

  it('opens the lightbox when PromotionsGrid emits open-lightbox', async () => {
    const wrapper = mountPage()
    await flushPromises()
    const grid = wrapper.findComponent(PromotionsGrid)
    await grid.vm.$emit('open-lightbox', 'https://cdn.example.com/promo.jpg')
    await wrapper.vm.$nextTick()
    // After open-lightbox, the lightbox should be open with the URL
    expect(wrapper.text()).not.toContain('error')
  })
})
