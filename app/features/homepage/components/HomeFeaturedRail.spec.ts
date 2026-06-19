import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FeaturedDish } from '@/types/content'
import HomeFeaturedRail from './HomeFeaturedRail.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const stubs = {
  DishCard: { props: ['dish'], template: '<div class="dish-stub" />' },
}

function makeDish(id: string): FeaturedDish {
  return {
    id,
    name: `Dish ${id}`,
    description: { es: 'd', en: 'd' },
    imageUrl: null,
    badge: null,
    category: 'frio',
  }
}

function mountRail(dishes: FeaturedDish[]) {
  return mount(HomeFeaturedRail, { props: { dishes }, global: { stubs } })
}

describe('HomeFeaturedRail', () => {
  it('renders one DishCard per dish in a scroll-snap rail', () => {
    const wrapper = mountRail([makeDish('1'), makeDish('2'), makeDish('3')])
    expect(wrapper.findAll('.dish-stub')).toHaveLength(3)
    expect(wrapper.find('.featured-rail__track').exists()).toBe(true)
  })

  it('renders nothing when there are no dishes (rail hides)', () => {
    const wrapper = mountRail([])
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.findAll('.dish-stub')).toHaveLength(0)
  })
})
