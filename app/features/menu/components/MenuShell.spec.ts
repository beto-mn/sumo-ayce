import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuResult } from '@/types/menu'
import MenuShell from './MenuShell.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

vi.stubGlobal('useRouter', () => ({ replace: vi.fn() }))
vi.stubGlobal('useRoute', () => ({ query: {} }))

const menuData: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [
    {
      key: 'cold_rolls',
      name: { es: 'Sushi Frío', en: 'Cold Rolls' },
      displayOrder: 0,
      dishes: [
        {
          id: 'd1',
          name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
          description: { es: 'Salmón fresco.', en: 'Fresh salmon.' },
          imageUrl: null,
          badge: null,
          price: null,
          incluido: true,
          drinkGroup: null,
          drinkSubGroup: null,
          requiresSauce: false,
        },
      ],
    },
    {
      key: 'drinks',
      name: { es: 'Bebidas', en: 'Drinks' },
      displayOrder: 1,
      dishes: [
        {
          id: 'dr1',
          name: { es: 'Coca-Cola', en: 'Coca-Cola' },
          description: { es: 'Refresco.', en: 'Soda.' },
          imageUrl: null,
          badge: null,
          price: '50.00',
          incluido: false,
          drinkGroup: 'sodas',
          drinkSubGroup: null,
          requiresSauce: false,
        },
      ],
    },
  ],
  sauces: [],
}

const stubs = {
  MenuTypeToggle: { template: '<div class="type-toggle-stub" />' },
  MenuModalityToggle: { template: '<div class="modality-toggle-stub" />' },
  MenuCategoryChips: { template: '<div class="chips-stub" />' },
  MenuDishGrid: { template: '<div class="dish-grid-stub" />' },
  MenuDrinkSection: { template: '<div class="drink-section-stub" />' },
}

function mountShell(
  props: Partial<{
    initialType: 'ayce' | 'express'
    initialModality: 'buffet' | 'carta'
  }> = {}
) {
  return mount(MenuShell, {
    props: {
      menuData,
      initialType: 'ayce',
      initialModality: 'buffet',
      ...props,
    },
    global: { stubs },
  })
}

describe('MenuShell', () => {
  it('renders without crashing', () => {
    expect(mountShell().exists()).toBe(true)
  })

  it('renders MenuTypeToggle', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.type-toggle-stub').exists()).toBe(true)
  })

  it('renders MenuModalityToggle when type is ayce (US3 SC1)', () => {
    const wrapper = mountShell({ initialType: 'ayce' })
    expect(wrapper.find('.modality-toggle-stub').exists()).toBe(true)
  })

  it('hides MenuModalityToggle when type is express (US3 SC1)', () => {
    const wrapper = mountShell({ initialType: 'express' })
    expect(wrapper.find('.modality-toggle-stub').exists()).toBe(false)
  })

  it('renders MenuCategoryChips', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.chips-stub').exists()).toBe(true)
  })

  it('renders MenuDishGrid for food categories', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.dish-grid-stub').exists()).toBe(true)
  })

  it('renders MenuDrinkSection when drinks are present', () => {
    const wrapper = mountShell()
    expect(wrapper.find('.drink-section-stub').exists()).toBe(true)
  })
})
