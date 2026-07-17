import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { PrimarySelection } from '@/features/menu/menu-sets'
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
      key: 'appetizers',
      name: { es: 'Entradas', en: 'Appetizers' },
      note: null,
      displayOrder: 0,
      dishes: [
        {
          id: 'd1',
          name: { es: 'Edamames', en: 'Edamame' },
          description: { es: 'Vainas de soya.', en: 'Soybean pods.' },
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
      key: 'drinks',
      name: { es: 'Bebidas', en: 'Drinks' },
      note: null,
      displayOrder: 1,
      dishes: [
        {
          id: 'dr1',
          name: { es: 'Refresco', en: 'Soda' },
          description: { es: 'Refresco.', en: 'Soda.' },
          imageUrl: null,
          badge: null,
          price: '69.00',
          incluido: false,
          includedInAyce: false,
          drinkGroup: 'sodas',
          drinkSubGroup: null,
          featured: false,
          highlightBackground: false,
          optionGroups: [],
        },
      ],
    },
    {
      key: 'kids',
      name: { es: 'Menú Kids', en: 'Kids Menu' },
      note: { es: 'Incluye papas…', en: 'Includes fries…' },
      displayOrder: 2,
      dishes: [
        {
          id: 'kids-ayce',
          name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
          description: { es: 'Buffet.', en: 'Buffet.' },
          imageUrl: null,
          badge: null,
          price: '179.00',
          incluido: false,
          includedInAyce: true,
          drinkGroup: null,
          drinkSubGroup: null,
          featured: false,
          highlightBackground: false,
          optionGroups: [],
        },
        {
          id: 'k1',
          name: { es: 'Kid Burger', en: 'Kid Burger' },
          description: { es: 'Smash 60g.', en: '60g smash.' },
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
    },
  ],
  drinkGroups: [
    {
      key: 'jumbo_cocktails',
      name: { es: 'Coctelería Jumbo', en: 'Jumbo Cocktails' },
      displayOrder: 0,
      promo: null,
    },
    {
      key: 'sodas',
      name: { es: 'Refrescos y Bebidas', en: 'Sodas & Beverages' },
      displayOrder: 2,
      promo: null,
    },
  ],
}

const stubs = {
  MenuTypeToggle: {
    template: '<div class="type-toggle-stub"><slot name="modality" /></div>',
  },
  MenuModalityToggle: { template: '<div class="modality-toggle-stub" />' },
  MenuCategoryChips: { template: '<div class="chips-stub" />' },
  MenuDishGrid: {
    props: ['categories', 'modality'],
    template:
      '<div class="dish-grid-stub" :data-count="categories.length" :data-modality="modality"><span v-for="c in categories" class="grid-section" :data-note="c.note ? c.note.es : \'\'">{{ c.name.es }}|{{ c.dishes.length }}</span></div>',
  },
  MenuDrinkSection: { template: '<div class="drink-section-stub" />' },
}

function mountShell(
  props: Partial<{
    initialSelection: PrimarySelection
    initialModality: 'buffet' | 'carta'
  }> = {}
) {
  return mount(MenuShell, {
    props: {
      menuData,
      initialSelection: 'ayce',
      initialModality: 'buffet',
      ...props,
    },
    global: { stubs },
  })
}

describe('MenuShell', () => {
  it('renders the primary selector', () => {
    expect(mountShell().find('.type-toggle-stub').exists()).toBe(true)
  })

  it('shows the modality toggle for AYCE', () => {
    expect(
      mountShell({ initialSelection: 'ayce' })
        .find('.modality-toggle-stub')
        .exists()
    ).toBe(true)
  })

  it('hides the modality toggle for Express', () => {
    expect(
      mountShell({ initialSelection: 'express' })
        .find('.modality-toggle-stub')
        .exists()
    ).toBe(false)
  })

  it('hides the modality toggle for Kids', () => {
    expect(
      mountShell({ initialSelection: 'kids' })
        .find('.modality-toggle-stub')
        .exists()
    ).toBe(false)
  })

  it('renders the modality toggle BETWEEN the type pill and Bebidas/Kids (slot order)', () => {
    // The MenuModalityToggle is passed via the #modality slot of MenuTypeToggle,
    // so in DOM order it sits inside the type toggle, before the standalone
    // Bebidas/Kids buttons — never on a separate row after them.
    const html = mountShell({ initialSelection: 'ayce' }).html()
    const toggleIdx = html.indexOf('type-toggle-stub')
    const modalityIdx = html.indexOf('modality-toggle-stub')
    expect(toggleIdx).toBeGreaterThan(-1)
    expect(modalityIdx).toBeGreaterThan(toggleIdx)
  })

  it('renders the category chips for AYCE', () => {
    expect(mountShell().find('.chips-stub').exists()).toBe(true)
  })

  it('hides the category chips for the Kids view (single flat list)', () => {
    expect(
      mountShell({ initialSelection: 'kids' }).find('.chips-stub').exists()
    ).toBe(false)
  })

  it('renders the food grid (single active category) for AYCE, not the drink section', () => {
    const wrapper = mountShell({ initialSelection: 'ayce' })
    expect(wrapper.find('.dish-grid-stub').exists()).toBe(true)
    expect(wrapper.find('.drink-section-stub').exists()).toBe(false)
  })

  it('renders the drink section (not the food grid) for the Bebidas selection', () => {
    const wrapper = mountShell({ initialSelection: 'drinks' })
    expect(wrapper.find('.drink-section-stub').exists()).toBe(true)
    expect(wrapper.find('.dish-grid-stub').exists()).toBe(false)
  })

  it('renders the food grid (the kids list) for the Kids selection, not the drink section', () => {
    const wrapper = mountShell({ initialSelection: 'kids' })
    expect(wrapper.find('.dish-grid-stub').exists()).toBe(true)
    expect(wrapper.find('.drink-section-stub').exists()).toBe(false)
  })

  it('splits the Kids view into two ordered sub-sections (AYCE first, Combo second)', () => {
    const grid = mountShell({ initialSelection: 'kids' }).find(
      '.dish-grid-stub'
    )
    expect(grid.attributes('data-count')).toBe('2')
    const sections = grid.findAll('.grid-section')
    // Heading comes from i18n (stub returns the key); dish count after the pipe.
    expect(sections[0]?.text()).toBe('menu.kids.ayce_heading|1')
    expect(sections[1]?.text()).toBe('menu.kids.combo_heading|1')
  })

  it('renders the kids list in carta (priced) mode', () => {
    const grid = mountShell({ initialSelection: 'kids' }).find(
      '.dish-grid-stub'
    )
    expect(grid.attributes('data-modality')).toBe('carta')
  })

  it('attaches the inclusion note ONLY to the Combo Infantil sub-section', () => {
    const sections = mountShell({ initialSelection: 'kids' }).findAll(
      '.grid-section'
    )
    // AYCE section carries no note; Combo section carries the DB note.
    expect(sections[0]?.attributes('data-note')).toBe('')
    expect(sections[1]?.attributes('data-note')).toBe('Incluye papas…')
  })
})
