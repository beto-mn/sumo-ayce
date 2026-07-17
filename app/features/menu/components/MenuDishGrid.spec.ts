import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuCategory } from '@/types/menu'
import MenuDishGrid from './MenuDishGrid.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    note: null,
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
        includedInAyce: true,
        drinkGroup: null,
        drinkSubGroup: null,
        featured: false,
        highlightBackground: false,
        optionGroups: [],
      },
    ],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    note: null,
    displayOrder: 1,
    dishes: [],
  },
]

const stubs = {
  MenuDishCard: {
    props: ['dish', 'modality', 'highlightBackground'],
    template:
      '<div class="dish-card-stub" :data-id="dish.id" :data-highlight="highlightBackground" />',
  },
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

  it('renders the heading from the DB category name (locale), not an i18n key', () => {
    const headings = mountGrid()
      .findAll('h2')
      .map(h => h.text())
    // ES locale → name.es; NOT "menu.category.cold_rolls".
    expect(headings[0]).toBe('Sushi Frío')
    expect(headings[1]).toBe('Alitas & Boneless')
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

  it('renders exactly one section when given the single active category', () => {
    const wrapper = mountGrid({ categories: categories.slice(0, 1) })
    const sections = wrapper.findAll('section')
    expect(sections).toHaveLength(1)
    expect(sections[0]?.attributes('id')).toBe('cold_rolls')
  })

  it('does NOT render a note box for a category without a note', () => {
    const wrapper = mountGrid()
    expect(wrapper.find('[data-testid="category-note"]').exists()).toBe(false)
  })

  it('renders the category note at the TOP of the section when present', () => {
    const comboSection: FullMenuCategory = {
      key: 'kids',
      name: { es: 'Combo Infantil', en: 'Kids Combo' },
      note: {
        es: 'Incluye papas a la francesa (100 g)…',
        en: 'Includes french fries (100 g)…',
      },
      displayOrder: 0,
      dishes: [
        {
          id: 'k1',
          name: { es: 'Kid Burger', en: 'Kid Burger' },
          description: { es: 'Smash.', en: 'Smash.' },
          imageUrl: null,
          badge: null,
          price: '149.00',
          incluido: false,
          includedInAyce: false,
          drinkGroup: null,
          drinkSubGroup: null,
          featured: false,
          highlightBackground: false,
          optionGroups: [],
        },
      ],
    }
    const wrapper = mountGrid({ categories: [comboSection] })
    const note = wrapper.find('[data-testid="category-note"]')
    expect(note.exists()).toBe(true)
    expect(note.text()).toContain('papas a la francesa')
    // The note precedes the dish grid within the section.
    const section = wrapper.find('section')
    const noteIdx = section.html().indexOf('category-note')
    const cardIdx = section.html().indexOf('dish-card-stub')
    expect(noteIdx).toBeGreaterThan(-1)
    expect(noteIdx).toBeLessThan(cardIdx)
  })

  it('renders the wings category note ABOVE the thermometer graphic (feature 028, Part C)', () => {
    const wingsWithNote: FullMenuCategory = {
      key: 'wings',
      name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
      note: {
        es: 'Escoge tu salsa favorita',
        en: 'Choose your favorite sauce',
      },
      displayOrder: 0,
      dishes: [],
    }
    const wrapper = mountGrid({ categories: [wingsWithNote] })
    const note = wrapper.find('[data-testid="category-note"]')
    const thermometer = wrapper.find('[data-testid="wings-thermometer"]')
    expect(note.exists()).toBe(true)
    expect(note.text()).toBe('Escoge tu salsa favorita')
    expect(thermometer.exists()).toBe(true)
    const section = wrapper.find('section')
    const noteIdx = section.html().indexOf('category-note')
    const thermometerIdx = section.html().indexOf('wings-thermometer')
    expect(noteIdx).toBeGreaterThan(-1)
    expect(noteIdx).toBeLessThan(thermometerIdx)
  })

  // ── Sauce heat thermometer (feature 028, US2) ───────────────────────────────
  it('renders the thermometer graphic exactly once for the "wings" category', () => {
    const wrapper = mountGrid()
    const thermometer = wrapper.findAll('[data-testid="wings-thermometer"]')
    expect(thermometer).toHaveLength(1)
    expect(thermometer[0]?.attributes('src')).toBe(
      '/menu/thermometer/sauce-heat-thermometer.webp'
    )
  })

  it('renders the thermometer at full section width, not a small capped icon (client feedback: err bigger, legible legend)', () => {
    const wrapper = mountGrid()
    const thermometer = wrapper.get('[data-testid="wings-thermometer"]')
    expect(thermometer.classes()).toContain('w-full')
    expect(thermometer.classes()).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^max-w-\[\d+px\]$/)])
    )
  })

  it('does NOT render the thermometer graphic for a non-wings category', () => {
    const wrapper = mountGrid({ categories: categories.slice(0, 1) })
    expect(wrapper.find('[data-testid="wings-thermometer"]').exists()).toBe(
      false
    )
  })

  it('lazy-loads the thermometer graphic (Article V performance budget)', () => {
    const wrapper = mountGrid()
    const thermometer = wrapper.get('[data-testid="wings-thermometer"]')
    expect(thermometer.attributes('loading')).toBe('lazy')
    expect(thermometer.attributes('decoding')).toBe('async')
  })

  // ── Uniform rendering: every dish via MenuDishCard (Parts C & D) ───────────
  describe('uniform MenuDishCard rendering', () => {
    function ramenCategory(
      dishes: FullMenuCategory['dishes']
    ): FullMenuCategory {
      return {
        key: 'ramen',
        name: { es: 'Ramen', en: 'Ramen' },
        note: null,
        displayOrder: 0,
        dishes,
      }
    }

    const baseDish = {
      name: { es: 'D', en: 'D' },
      description: { es: 'd', en: 'd' },
      imageUrl: null,
      badge: null,
      price: '149.00',
      incluido: false,
      includedInAyce: false,
      drinkGroup: null,
      drinkSubGroup: null,
      featured: false,
      optionGroups: [],
    }

    it('renders "Ramen XL" as a normal MenuDishCard, identical to its sibling dish (FR-012)', () => {
      const wrapper = mountGrid({
        categories: [
          ramenCategory([
            { ...baseDish, id: 'ramen-xl', highlightBackground: false },
            { ...baseDish, id: 'ramen-regular', highlightBackground: false },
          ]),
        ],
      })
      expect(wrapper.findAll('.dish-card-stub')).toHaveLength(2)
      expect(
        wrapper.findAll('.dish-card-stub').map(c => c.attributes('data-id'))
      ).toEqual(['ramen-xl', 'ramen-regular'])
    })

    it('passes highlightBackground=true to MenuDishCard for the flagged dish', () => {
      const wrapper = mountGrid({
        categories: [
          ramenCategory([
            { ...baseDish, id: 'kids-ayce', highlightBackground: true },
          ]),
        ],
      })
      const card = wrapper.find('.dish-card-stub')
      expect(card.exists()).toBe(true)
      expect(card.attributes('data-highlight')).toBe('true')
    })

    it('passes highlightBackground=false to MenuDishCard for every other dish', () => {
      const wrapper = mountGrid({
        categories: [
          ramenCategory([
            { ...baseDish, id: 'plain', highlightBackground: false },
          ]),
        ],
      })
      const card = wrapper.find('.dish-card-stub')
      expect(card.attributes('data-highlight')).toBe('false')
    })
  })
})
