import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuDish } from '@/types/menu'
import MenuDrinkSection from './MenuDrinkSection.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const drinks: FullMenuDish[] = [
  {
    id: 'dr1',
    name: { es: 'Margarita Jumbo', en: 'Jumbo Margarita' },
    description: { es: 'Tequila, limón y sal.', en: 'Tequila, lime and salt.' },
    imageUrl: null,
    badge: null,
    price: '180.00',
    incluido: false,
    drinkGroup: 'jumbo_cocktails',
    drinkSubGroup: null,
    requiresSauce: false,
  },
  {
    id: 'dr2',
    name: { es: 'Coca-Cola', en: 'Coca-Cola' },
    description: { es: 'Refresco 500 ml.', en: '500 ml soda.' },
    imageUrl: null,
    badge: null,
    price: '50.00',
    incluido: false,
    drinkGroup: 'sodas',
    drinkSubGroup: null,
    requiresSauce: false,
  },
  {
    id: 'dr3',
    name: { es: 'Agua Mineral', en: 'Sparkling Water' },
    description: { es: 'Agua mineral 355 ml.', en: '355 ml sparkling water.' },
    imageUrl: null,
    badge: null,
    price: '40.00',
    incluido: false,
    drinkGroup: 'sodas',
    drinkSubGroup: null,
    requiresSauce: false,
  },
]

const stubs = {
  NuxtImg: { template: '<img />' },
}

function mountSection(overDrinks = drinks, activeGroup: string | null = null) {
  return mount(MenuDrinkSection, {
    props: { drinks: overDrinks, activeGroup },
    global: { stubs },
  })
}

describe('MenuDrinkSection', () => {
  // US5 SC1 — section renders for any page type (drinks is always visible)
  it('renders without crashing (US5 SC1)', () => {
    expect(mountSection().exists()).toBe(true)
  })

  it('renders the drinks section container with id="drinks"', () => {
    const wrapper = mountSection()
    expect(wrapper.find('#drinks').exists()).toBe(true)
  })

  // US5 SC2 — drinks grouped by drinkGroup with group headers
  it('renders a group header per unique drinkGroup (US5 SC2)', () => {
    const wrapper = mountSection()
    // jumbo_cocktails and sodas → 2 h3 group headers
    const headers = wrapper.findAll('h3')
    expect(headers).toHaveLength(2)
  })

  it('renders the i18n key for each group header', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('menu.drink_group.jumbo_cocktails')
    expect(wrapper.text()).toContain('menu.drink_group.sodas')
  })

  it('renders each drink name', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('Margarita Jumbo')
    expect(wrapper.text()).toContain('Coca-Cola')
    expect(wrapper.text()).toContain('Agua Mineral')
  })

  it('renders drink prices', () => {
    const wrapper = mountSection()
    expect(wrapper.text()).toContain('180.00')
    expect(wrapper.text()).toContain('50.00')
  })

  it('filters drinks by activeGroup when provided', () => {
    const wrapper = mountSection(drinks, 'sodas')
    // Only the sodas group should be visible
    const headers = wrapper.findAll('h3')
    expect(headers).toHaveLength(1)
    expect(wrapper.text()).toContain('menu.drink_group.sodas')
    expect(wrapper.text()).not.toContain('menu.drink_group.jumbo_cocktails')
  })
})
