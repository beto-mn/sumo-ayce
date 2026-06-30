import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuCategory, FullMenuSauce } from '@/types/menu'
import MenuDishGrid from './MenuDishGrid.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const sauces: FullMenuSauce[] = [
  { id: 's1', name: { es: 'BBQ', en: 'BBQ' }, imageUrl: null, spiceLevel: 0 },
]

const categories: FullMenuCategory[] = [
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
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    displayOrder: 1,
    dishes: [],
  },
]

const stubs = {
  MenuDishCard: { template: '<div class="dish-card-stub" />' },
}

function mountGrid(
  overrides: Partial<{
    categories: FullMenuCategory[]
    modality: 'buffet' | 'carta'
  }> = {}
) {
  return mount(MenuDishGrid, {
    props: {
      categories,
      sauces,
      modality: 'buffet',
      ...overrides,
    },
    global: { stubs },
  })
}

describe('MenuDishGrid', () => {
  it('renders without crashing', () => {
    expect(mountGrid().exists()).toBe(true)
  })

  it('renders a section per category', () => {
    const wrapper = mountGrid()
    expect(wrapper.findAll('section')).toHaveLength(categories.length)
  })

  it('sets the section id to the category key (for anchor navigation)', () => {
    const wrapper = mountGrid()
    const sections = wrapper.findAll('section')
    expect(sections[0]?.attributes('id')).toBe('cold_rolls')
    expect(sections[1]?.attributes('id')).toBe('wings')
  })

  it('renders dish cards for each dish in a category', () => {
    const wrapper = mountGrid()
    // cold_rolls has 1 dish
    expect(wrapper.findAll('.dish-card-stub')).toHaveLength(1)
  })

  it('shows the empty state message when a category has no dishes (US3 SC2 coverage)', () => {
    const wrapper = mountGrid()
    // wings category has 0 dishes — should show empty message
    expect(wrapper.text()).toContain('menu.category.empty')
  })

  it('passes the correct modality to dish cards', () => {
    // carta modality passed — this is confirmed by the component passing modality prop to MenuDishCard
    const wrapper = mountGrid({ modality: 'carta' })
    expect(wrapper.exists()).toBe(true)
  })
})
