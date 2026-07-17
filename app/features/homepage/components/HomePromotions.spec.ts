import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'
import HomePromotions from './HomePromotions.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const stubs = {
  UiPromotionsCarousel: {
    name: 'UiPromotionsCarousel',
    props: ['promotions'],
    template: '<div class="carousel-stub" :data-count="promotions.length" />',
  },
  UiKicker: { template: '<span class="kicker-stub"><slot /></span>' },
}

function makePromo(id: string, overrides: Partial<Promotion> = {}): Promotion {
  return {
    id,
    badge: { es: 'b', en: 'b' },
    title: 't',
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageDesktopUrl: null,
    imageTabletUrl: null,
    imageMovilUrl: null,
    terms: null,
    ...overrides,
  }
}

function mountSection(promotions: Promotion[]) {
  return mount(HomePromotions, { props: { promotions }, global: { stubs } })
}

describe('HomePromotions', () => {
  it('renders the carousel with all provided promotions', () => {
    const wrapper = mountSection([
      makePromo('1'),
      makePromo('2'),
      makePromo('3'),
    ])
    const carousel = wrapper.find('.carousel-stub')
    expect(carousel.exists()).toBe(true)
    expect(carousel.attributes('data-count')).toBe('3')
  })

  it('renders nothing when there are no promotions (section hides)', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.find('.carousel-stub').exists()).toBe(false)
  })

  it('renders the kicker in the header', () => {
    const wrapper = mountSection([makePromo('1')])
    expect(wrapper.find('.kicker-stub').exists()).toBe(true)
    expect(wrapper.find('header').text()).toContain('home.promotions.kicker')
  })

  it('renders the visible title heading (home.promotions.title)', () => {
    const heading = mountSection([makePromo('1')]).find('h2')
    expect(heading.exists()).toBe(true)
    expect(heading.text()).toBe('home.promotions.title')
  })

  it('does NOT render a "see all" CTA link (carousel shows all promos)', () => {
    const wrapper = mountSection([makePromo('1')])
    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('home.promotions.cta')
  })
})
