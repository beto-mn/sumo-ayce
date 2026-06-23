import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Review } from '@/types/content'
import { selectPromotions } from '../utils/select-promotions'
import HomeFeaturedRail from './HomeFeaturedRail.vue'
import HomePromotions from './HomePromotions.vue'
import HomeReviews from './HomeReviews.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)

const stubs = {
  DishCard: { props: ['dish'], template: '<div class="dish-stub" />' },
  UiPromotionCard: {
    props: ['promotion'],
    template: '<div class="promo-stub" />',
  },
  ReviewCard: { props: ['review'], template: '<div class="review-stub" />' },
  UiLightbox: {
    props: ['open', 'src', 'alt'],
    template: '<div class="lightbox-stub" />',
  },
  UiKicker: { template: '<span><slot /></span>' },
  UiButton: { template: '<button><slot /></button>' },
  NuxtLink: { props: ['to'], template: '<a><slot /></a>' },
}

const reviews: Review[] = [
  {
    id: 'r1',
    authorName: 'Test User',
    rating: 5,
    text: { es: 'Bueno.', en: 'Good.' },
    source: 'google',
    reviewedAt: null,
  },
]

describe('homepage graceful degradation', () => {
  it('hides the featured rail when the dishes route fails (empty dishes)', () => {
    // useFeaturedDishes returns { dishes: [], ok: false } on failure.
    const wrapper = mount(HomeFeaturedRail, {
      props: { dishes: [] },
      global: { stubs },
    })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('hides the promotions section when WordPress is unreachable (empty)', () => {
    // usePromotions returns { promotions: [], ok: false } → selectPromotions([]) === []
    const wrapper = mount(HomePromotions, {
      props: { promotions: selectPromotions([]) },
      global: { stubs },
    })
    expect(wrapper.find('section').exists()).toBe(false)
  })

  it('still renders the static reviews regardless of upstream outages', () => {
    const wrapper = mount(HomeReviews, {
      props: { reviews },
      global: { stubs },
    })
    expect(wrapper.find('section').exists()).toBe(true)
    expect(wrapper.findAll('.review-stub')).toHaveLength(1)
  })

  it('surfaces no technical error when both data sources are empty', () => {
    const rail = mount(HomeFeaturedRail, {
      props: { dishes: [] },
      global: { stubs },
    })
    const promos = mount(HomePromotions, {
      props: { promotions: [] },
      global: { stubs },
    })
    expect(rail.text()).not.toMatch(/error|undefined|null/i)
    expect(promos.text()).not.toMatch(/error|undefined|null/i)
  })
})
