import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FeaturedDish } from '@/types/content'
import DishCard from './DishCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const stubs = {
  UiCard: { template: '<div class="card-stub"><slot /></div>' },
  UiSticker: { template: '<span class="sticker-stub"><slot /></span>' },
}

function makeDish(overrides: Partial<FeaturedDish> = {}): FeaturedDish {
  return {
    id: 'd1',
    name: 'Salmón Nigiri',
    description: { es: 'Salmón fresco.', en: 'Fresh salmon.' },
    imageUrl: 'https://cdn.test/nigiri.webp',
    badge: null,
    category: 'frio',
    ...overrides,
  }
}

function mountCard(dish: FeaturedDish) {
  return mount(DishCard, { props: { dish }, global: { stubs } })
}

describe('DishCard', () => {
  it('renders the dish name', () => {
    expect(mountCard(makeDish()).text()).toContain('Salmón Nigiri')
  })

  it('renders the dish image when imageUrl is present', () => {
    const img = mountCard(makeDish()).find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('https://cdn.test/nigiri.webp')
  })

  it('renders a neutral SUMO placeholder (no img) when imageUrl is null', () => {
    const wrapper = mountCard(makeDish({ imageUrl: null }))
    expect(wrapper.find('img').exists()).toBe(false)
    // Placeholder is the aria-hidden SUMO wordmark block.
    expect(wrapper.find('[aria-hidden="true"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('SUMO')
  })

  it('renders the badge sticker when a badge is present', () => {
    const wrapper = mountCard(makeDish({ badge: 'Top' }))
    expect(wrapper.find('.sticker-stub').text()).toContain('Top')
  })

  it('does not render a badge sticker when badge is null', () => {
    expect(
      mountCard(makeDish({ badge: null }))
        .find('.sticker-stub')
        .exists()
    ).toBe(false)
  })
})
