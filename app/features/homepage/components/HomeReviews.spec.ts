import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Review } from '@/types/content'
import HomeReviews from './HomeReviews.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const stubs = {
  ReviewCard: { props: ['review'], template: '<div class="review-stub" />' },
}

function makeReview(id: string): Review {
  return {
    id,
    authorName: `Author ${id}`,
    rating: 5,
    text: { es: 'Bueno.', en: 'Good.' },
    source: 'google',
    reviewedAt: null,
  }
}

function mountSection(reviews: Review[]) {
  return mount(HomeReviews, { props: { reviews }, global: { stubs } })
}

describe('HomeReviews', () => {
  it('renders one ReviewCard per review', () => {
    const wrapper = mountSection([makeReview('1'), makeReview('2')])
    expect(wrapper.findAll('.review-stub')).toHaveLength(2)
  })

  it('hides defensively when there are no reviews', () => {
    const wrapper = mountSection([])
    expect(wrapper.find('section').exists()).toBe(false)
  })
})
