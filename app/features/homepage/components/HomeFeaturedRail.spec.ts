import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { FeaturedDish } from '@/types/content'

const ES: Record<string, string> = {
  'home.featured.title': 'Los favoritos de nuestros clientes',
  'home.featured.heading': 'Garantía Sumo',
  'home.featured.subtitle': 'Amado y recomendado por nuestros clientes',
}

const EN: Record<string, string> = {
  'home.featured.title': "Our customers' favorites",
  'home.featured.heading': 'Sumo Guarantee',
  'home.featured.subtitle': 'Loved and recommended by our customers',
}

function stubLocale(map: Record<string, string>) {
  vi.stubGlobal('useI18n', () => ({
    t: (k: string) => map[k] ?? k,
    locale: { value: 'es' },
  }))
}

const stubs = {
  DishCard: { props: ['dish'], template: '<div class="dish-stub" />' },
  UiKicker: { template: '<span class="kicker-stub"><slot /></span>' },
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

async function mountRail(dishes: FeaturedDish[], map = ES) {
  stubLocale(map)
  const HomeFeaturedRail = (await import('./HomeFeaturedRail.vue')).default
  return mount(HomeFeaturedRail, { props: { dishes }, global: { stubs } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('HomeFeaturedRail', () => {
  it('renders one DishCard per dish in a scroll-snap rail', async () => {
    const wrapper = await mountRail([
      makeDish('1'),
      makeDish('2'),
      makeDish('3'),
    ])
    expect(wrapper.findAll('.dish-stub')).toHaveLength(3)
    expect(wrapper.find('.featured-rail__track').exists()).toBe(true)
  })

  it('renders the three header lines (label, heading, subtitle) in ES', async () => {
    const wrapper = await mountRail([makeDish('1')], ES)
    const text = wrapper.text()
    expect(wrapper.find('.kicker-stub').text()).toBe(
      'Los favoritos de nuestros clientes'
    )
    expect(wrapper.find('h2').text()).toBe('Garantía Sumo')
    expect(text).toContain('Amado y recomendado por nuestros clientes')
  })

  it('renders the three header lines in EN', async () => {
    const wrapper = await mountRail([makeDish('1')], EN)
    expect(wrapper.find('.kicker-stub').text()).toBe("Our customers' favorites")
    expect(wrapper.find('h2').text()).toBe('Sumo Guarantee')
    expect(wrapper.text()).toContain('Loved and recommended by our customers')
  })

  it('renders nothing when there are no dishes (rail hides)', async () => {
    const wrapper = await mountRail([])
    expect(wrapper.find('section').exists()).toBe(false)
    expect(wrapper.findAll('.dish-stub')).toHaveLength(0)
  })
})
