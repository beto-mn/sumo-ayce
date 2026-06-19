import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { Review } from '@/types/content'
import ReviewCard from './ReviewCard.vue'

const localeRef = { value: 'es' }
vi.stubGlobal('useI18n', () => ({
  t: (k: string, p?: Record<string, unknown>) =>
    p ? `${k}:${JSON.stringify(p)}` : k,
  locale: localeRef,
}))

const stubs = { UiCard: { template: '<div class="card-stub"><slot /></div>' } }

function makeReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r1',
    authorName: 'Mariana López',
    rating: 5,
    text: { es: 'Excelente.', en: 'Excellent.' },
    source: 'google',
    reviewedAt: '2026-05-12',
    ...overrides,
  }
}

function mountCard(review: Review) {
  return mount(ReviewCard, { props: { review }, global: { stubs } })
}

describe('ReviewCard', () => {
  it('renders the author name', () => {
    expect(mountCard(makeReview()).text()).toContain('Mariana López')
  })

  it('renders the review text in the active locale', () => {
    expect(mountCard(makeReview()).text()).toContain('Excelente.')
  })

  it('renders the rating as stars matching the score', () => {
    const wrapper = mountCard(makeReview({ rating: 4 }))
    // Filled stars carry the yellow token color class.
    const filled = wrapper.findAll('.text-yellow')
    expect(filled).toHaveLength(4)
  })

  it('exposes an accessible rating label', () => {
    const wrapper = mountCard(makeReview({ rating: 5 }))
    expect(wrapper.find('[aria-label]').exists()).toBe(true)
  })
})
