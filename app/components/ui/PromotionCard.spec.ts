import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (k: string) => k,
}))

import PromotionCard from './PromotionCard.vue'

const AYCE_PROMO: Promotion = {
  id: '1',
  badge: { es: 'Martes', en: 'Tuesday' },
  title: { es: 'Martes 2x1', en: 'Tuesday 2for1' },
  description: { es: 'Trae un amigo gratis.', en: 'Bring a friend free.' },
  validity: { es: 'Solo martes', en: 'Tuesdays only' },
  color: 'orange',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-01T00:00:00Z',
  imageUrl: 'https://cdn.example.com/promo.jpg',
}

const EXPRESS_PROMO: Promotion = {
  id: '2',
  badge: { es: 'Express', en: 'Express' },
  title: { es: 'Express Deal', en: 'Express Deal' },
  description: { es: 'Descuento express.', en: 'Express discount.' },
  validity: { es: 'Siempre', en: 'Always' },
  color: 'blue',
  type: 'express',
  active: true,
  publishedAt: '2026-06-02T00:00:00Z',
  imageUrl: 'https://cdn.example.com/express.jpg',
}

const ALL_PROMO: Promotion = {
  id: '3',
  badge: { es: 'Todos', en: 'All' },
  title: { es: 'Para todos', en: 'For all' },
  description: { es: 'Válido en todos.', en: 'Valid for all.' },
  validity: { es: 'Toda la semana', en: 'All week' },
  color: 'yellow',
  type: 'all',
  active: true,
  publishedAt: '2026-06-03T00:00:00Z',
  imageUrl: null,
}

const NO_IMAGE_PROMO: Promotion = {
  ...AYCE_PROMO,
  id: '4',
  imageUrl: null,
}

describe('PromotionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Content rendering ────────────────────────────────────────────────────────

  it('renders badge in Spanish (default locale)', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    expect(wrapper.text()).toContain('Martes')
  })

  it('renders title in Spanish (default locale)', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    expect(wrapper.text()).toContain('Martes 2x1')
  })

  it('renders description in Spanish (default locale)', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    expect(wrapper.text()).toContain('Trae un amigo gratis.')
  })

  it('renders validity in Spanish (default locale)', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    expect(wrapper.text()).toContain('Solo martes')
  })

  // ── Color rule ───────────────────────────────────────────────────────────────

  it('applies express-scope class to card wrapper for tipo=express', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: EXPRESS_PROMO },
    })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.classes()).toContain('scope-express')
  })

  it('does NOT apply express-scope class for tipo=ayce', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.classes()).not.toContain('scope-express')
  })

  it('shows SUMO Express type badge for tipo=express', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: EXPRESS_PROMO },
    })
    const badge = wrapper.find('[data-testid="type-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('promotions.typeBadge.express')
  })

  it('shows SUMO AYCE type badge for tipo=ayce', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const badge = wrapper.find('[data-testid="type-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('promotions.typeBadge.ayce')
  })

  it('does NOT show a type badge for tipo=all', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: ALL_PROMO } })
    const badge = wrapper.find('[data-testid="type-badge"]')
    expect(badge.exists()).toBe(false)
  })

  // ── Interactive vs non-interactive ──────────────────────────────────────────

  it('has pointer cursor when imageUrl is set', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.classes()).toContain('cursor-pointer')
  })

  it('has default cursor when imageUrl is null', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: NO_IMAGE_PROMO },
    })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.classes()).not.toContain('cursor-pointer')
  })

  it('emits open-lightbox with the imageUrl when clicked and imageUrl is set', async () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const card = wrapper.find('[data-testid="promotion-card"]')
    await card.trigger('click')
    expect(wrapper.emitted('open-lightbox')).toBeTruthy()
    expect(wrapper.emitted('open-lightbox')?.[0]?.[0]).toBe(
      'https://cdn.example.com/promo.jpg'
    )
  })

  it('does NOT emit open-lightbox when imageUrl is null', async () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: NO_IMAGE_PROMO },
    })
    const card = wrapper.find('[data-testid="promotion-card"]')
    await card.trigger('click')
    expect(wrapper.emitted('open-lightbox')).toBeFalsy()
  })

  it('emits open-lightbox on Enter keydown when imageUrl is set', async () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const card = wrapper.find('[data-testid="promotion-card"]')
    await card.trigger('keydown.enter')
    expect(wrapper.emitted('open-lightbox')).toBeTruthy()
  })

  it('does NOT emit open-lightbox on Enter keydown when imageUrl is null', async () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: NO_IMAGE_PROMO },
    })
    const card = wrapper.find('[data-testid="promotion-card"]')
    await card.trigger('keydown.enter')
    expect(wrapper.emitted('open-lightbox')).toBeFalsy()
  })

  it('has tabindex=0 when imageUrl is set', () => {
    const wrapper = mount(PromotionCard, { props: { promotion: AYCE_PROMO } })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.attributes('tabindex')).toBe('0')
  })

  it('has no tabindex when imageUrl is null', () => {
    const wrapper = mount(PromotionCard, {
      props: { promotion: NO_IMAGE_PROMO },
    })
    const card = wrapper.find('[data-testid="promotion-card"]')
    expect(card.attributes('tabindex')).toBeUndefined()
  })
})
