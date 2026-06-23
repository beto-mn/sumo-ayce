import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (k: string) => k,
}))

import PromotionCard from '@/components/ui/PromotionCard.vue'
import PromotionsGrid from './PromotionsGrid.vue'

const makePromo = (id: string, imageUrl: string | null = null): Promotion => ({
  id,
  badge: { es: `Badge ${id}`, en: `Badge ${id}` },
  title: { es: `Title ${id}`, en: `Title ${id}` },
  description: { es: `Desc ${id}`, en: `Desc ${id}` },
  validity: { es: `Valid ${id}`, en: `Valid ${id}` },
  color: 'orange',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-01T00:00:00Z',
  imageUrl,
})

const THREE_PROMOS = [makePromo('1'), makePromo('2'), makePromo('3')]

const globalConfig = {
  global: {
    components: { UiPromotionCard: PromotionCard },
  },
}

describe('PromotionsGrid', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one PromotionCard per promotion', () => {
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: THREE_PROMOS, ok: true },
    })
    const cards = wrapper.findAll('[data-testid="promotion-card"]')
    expect(cards).toHaveLength(3)
  })

  it('renders empty-state message when promotions array is empty', () => {
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: [], ok: true },
    })
    const cards = wrapper.findAll('[data-testid="promotion-card"]')
    expect(cards).toHaveLength(0)
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('promotions.empty')
  })

  it('renders empty-state message when ok is false', () => {
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: THREE_PROMOS, ok: false },
    })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('promotions.empty')
  })

  it('does NOT render empty-state when promotions are present and ok is true', () => {
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: THREE_PROMOS, ok: true },
    })
    expect(wrapper.find('[data-testid="empty-state"]').exists()).toBe(false)
  })

  it('forwards open-lightbox event from child card to parent', async () => {
    const promoWithImage = makePromo('img', 'https://cdn.example.com/img.jpg')
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: [promoWithImage], ok: true },
    })
    // Click the interactive card (imageUrl is set)
    await wrapper.find('[data-testid="promotion-card"]').trigger('click')
    expect(wrapper.emitted('open-lightbox')).toBeTruthy()
  })

  it('renders the grid container element', () => {
    const wrapper = mount(PromotionsGrid, {
      ...globalConfig,
      props: { promotions: THREE_PROMOS, ok: true },
    })
    expect(wrapper.find('[data-testid="promotions-grid"]').exists()).toBe(true)
  })
})
