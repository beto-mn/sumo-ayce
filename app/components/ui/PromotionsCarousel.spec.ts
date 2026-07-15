import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'

vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (k: string, params?: Record<string, unknown>) =>
    params ? `${k}:${JSON.stringify(params)}` : k,
}))

import PromotionsCarousel from './PromotionsCarousel.vue'

const stubs = {
  UiPromotionCard: {
    props: ['promotion'],
    template: '<div class="card-stub" :data-id="promotion.id" />',
  },
}

function makePromo(id: string): Promotion {
  return {
    id,
    badge: { es: 'b', en: 'b' },
    title: `Promo ${id}`,
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-01T00:00:00Z',
    imageDesktopUrl: 'https://cdn.test/d.jpg',
    imageTabletUrl: null,
    imageMovilUrl: null,
  }
}

const mountCarousel = (promotions: Promotion[]) =>
  mount(PromotionsCarousel, { props: { promotions }, global: { stubs } })

describe('PromotionsCarousel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders one slide per promotion', () => {
    const wrapper = mountCarousel([
      makePromo('1'),
      makePromo('2'),
      makePromo('3'),
    ])
    expect(wrapper.findAll('[data-testid="carousel-slide"]')).toHaveLength(3)
    expect(wrapper.findAll('.card-stub')).toHaveLength(3)
  })

  it('shows ONE full-width slide per view at all breakpoints (basis-full, no fractions)', () => {
    const slide = mountCarousel([makePromo('1'), makePromo('2')]).find(
      '[data-testid="carousel-slide"]'
    )
    const classes = slide.classes()
    expect(classes).toContain('basis-full')
    // No per-breakpoint fractional widths → never multiple cards per view.
    expect(classes).not.toContain('sm:basis-1/2')
    expect(classes).not.toContain('lg:basis-1/3')
  })

  it('renders nothing when there are no promotions', () => {
    const wrapper = mountCarousel([])
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.findAll('[data-testid="carousel-slide"]')).toHaveLength(0)
  })

  it('hides prev/next arrows for a single promotion', () => {
    const wrapper = mountCarousel([makePromo('only')])
    expect(wrapper.find('[data-testid="carousel-prev"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="carousel-next"]').exists()).toBe(false)
  })

  it('shows prev/next arrows for multiple promotions', () => {
    const wrapper = mountCarousel([makePromo('1'), makePromo('2')])
    expect(wrapper.find('[data-testid="carousel-prev"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="carousel-next"]').exists()).toBe(true)
  })

  it('mounts cleanly in happy-dom (embla behind the client guard)', () => {
    const wrapper = mountCarousel([makePromo('1'), makePromo('2')])
    expect(wrapper.find('[data-testid="carousel-viewport"]').exists()).toBe(
      true
    )
  })

  // ── Nav color follows the ACTIVE promo's type ───────────────────────────────
  it('colors the prev/next arrows orange when the active promo is AYCE', () => {
    const wrapper = mountCarousel([
      makePromo('1'),
      { ...makePromo('2'), type: 'express' },
    ])
    // selectedIndex defaults to 0 → active promo is the AYCE one.
    expect(wrapper.find('[data-testid="carousel-prev"]').classes()).toContain(
      'bg-orange'
    )
    expect(wrapper.find('[data-testid="carousel-next"]').classes()).toContain(
      'bg-orange'
    )
  })

  it('colors the arrows blue when the active promo is Express', () => {
    const wrapper = mountCarousel([
      { ...makePromo('1'), type: 'express' },
      makePromo('2'),
    ])
    expect(wrapper.find('[data-testid="carousel-prev"]').classes()).toContain(
      'bg-blue'
    )
    expect(wrapper.find('[data-testid="carousel-next"]').classes()).toContain(
      'bg-blue'
    )
  })

  it('uses the two-tone orange→blue gradient on the arrows for type=all', () => {
    const wrapper = mountCarousel([
      { ...makePromo('1'), type: 'all' },
      makePromo('2'),
    ])
    const next = wrapper.find('[data-testid="carousel-next"]')
    expect(next.classes()).toContain('from-orange')
    expect(next.classes()).toContain('to-blue')
  })

  it('keeps the border-pop/ink outline and 44px tap targets on the arrows', () => {
    const next = mountCarousel([makePromo('1'), makePromo('2')]).find(
      '[data-testid="carousel-next"]'
    )
    expect(next.classes()).toContain('border-pop')
    expect(next.classes()).toContain('border-ink')
    expect(next.classes()).toContain('min-h-[44px]')
    expect(next.classes()).toContain('min-w-[44px]')
  })

  it('exposes an accessible carousel label', () => {
    const wrapper = mountCarousel([makePromo('1'), makePromo('2')])
    const section = wrapper.find('section')
    expect(section.attributes('aria-label')).toBe('promotions.carousel.label')
  })
})
