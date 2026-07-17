import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuDish } from '@/types/menu'
import MenuDishCard from './MenuDishCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

function makeDish(overrides: Partial<FullMenuDish> = {}): FullMenuDish {
  return {
    id: 'd1',
    name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
    description: { es: 'Salmón fresco.', en: 'Fresh salmon.' },
    imageUrl: '/menu/ayce/bora_bora.webp',
    badge: null,
    price: null,
    incluido: true,
    includedInAyce: true,
    drinkGroup: null,
    drinkSubGroup: null,
    requiresSauce: false,
    featured: false,
    highlightBackground: false,
    optionGroups: [],
    ...overrides,
  }
}

function mountCard(
  dish: FullMenuDish,
  modality: 'buffet' | 'carta' = 'buffet',
  highlightBackground = false
) {
  return mount(MenuDishCard, {
    props: { dish, modality, highlightBackground },
    global: {
      stubs: {
        MenuSaucePicker: {
          props: ['options', 'pickerLabel'],
          template:
            '<div class="picker-stub" :data-label="pickerLabel" :data-count="options.length" />',
        },
      },
    },
  })
}

describe('MenuDishCard', () => {
  it('renders dish name and description', () => {
    const text = mountCard(makeDish()).text()
    expect(text).toContain('Bora Bora Roll')
    expect(text).toContain('Salmón fresco.')
  })

  it('renders the dish image when imageUrl is present', () => {
    const img = mountCard(makeDish()).find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/menu/ayce/bora_bora.webp')
  })

  it('renders no image container when imageUrl is null', () => {
    const wrapper = mountCard(makeDish({ imageUrl: null }))
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('applies the hover-zoom to the whole CARD root (not the image)', () => {
    const wrapper = mountCard(makeDish())
    const root = wrapper.get('div') // component root = outermost card div
    const cls = root.classes()
    // hoverOnlyWhenSupported (Tailwind) compiles `hover:` to @media(hover:hover);
    // motion-reduce disables the transform for reduced-motion users; hover:z-10
    // lifts the scaled card above its neighbors in the grid.
    expect(cls).toContain('hover:scale-105')
    expect(cls).toContain('hover:z-10')
    expect(cls).toContain('motion-reduce:transform-none')
    expect(cls).toContain('transition-transform')
    // The image itself is now static — no scale on it.
    const imgCls = wrapper.find('img').classes()
    expect(imgCls).not.toContain('hover:scale-110')
    expect(imgCls).not.toContain('hover:scale-105')
  })

  it('shows "Incluido" in buffet modality for an included dish', () => {
    expect(mountCard(makeDish({ incluido: true }), 'buffet').text()).toContain(
      'menu.dish.incluido'
    )
  })

  it('hides the price in buffet modality', () => {
    const wrapper = mountCard(
      makeDish({ price: '128.00', incluido: false }),
      'buffet'
    )
    expect(wrapper.text()).not.toContain('128.00')
  })

  it('shows the price in carta modality', () => {
    const wrapper = mountCard(
      makeDish({ price: '128.00', incluido: false }),
      'carta'
    )
    expect(wrapper.text()).toContain('128.00')
  })

  it('never renders a sauce picker (removed from wings — FR-021)', () => {
    // Even a formerly sauce-requiring wings dish shows no picker on the card.
    const wrapper = mountCard(makeDish({ requiresSauce: true }))
    expect(wrapper.find('.sauce-picker-stub').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('menu.dish.sauce_required')
  })

  // ── Garantía Sumo star badge (featured dishes) ──────────────────────────────
  it('renders the Garantía Sumo star badge when the dish is featured', () => {
    const badge = mountCard(makeDish({ featured: true })).find(
      '[data-testid="guarantee-badge"]'
    )
    expect(badge.exists()).toBe(true)
    expect(badge.attributes('src')).toBe('/brand/garantia-sumo.webp')
    expect(badge.attributes('alt')).toBe('menu.guarantee_alt')
    // 96px star (bumped from 64px — "no se nota" client feedback), pinned
    // top-left clear of the top-right pink badge.
    expect(badge.classes()).toContain('size-24')
    expect(badge.classes()).not.toContain('size-16')
    expect(badge.classes()).toContain('left-2')
    expect(badge.classes()).toContain('top-2')
  })

  it('does NOT render the Garantía Sumo badge when the dish is not featured', () => {
    const wrapper = mountCard(makeDish({ featured: false }))
    expect(wrapper.find('[data-testid="guarantee-badge"]').exists()).toBe(false)
  })

  it('shows the guarantee badge even for a featured dish with no image', () => {
    const badge = mountCard(makeDish({ featured: true, imageUrl: null })).find(
      '[data-testid="guarantee-badge"]'
    )
    expect(badge.exists()).toBe(true)
  })

  // ── Highlighted image panel (Part D — "All You Can Eat Kids") ──────────────
  it('uses the default panel background when highlightBackground is false/unset', () => {
    const panel = mountCard(makeDish()).find('[data-testid="dish-image-panel"]')
    expect(panel.classes()).toContain('bg-accent/20')
    expect(panel.classes()).not.toContain('from-orange')
  })

  it('swaps the panel to the orange→blue gradient when highlightBackground is true', () => {
    const panel = mountCard(makeDish(), 'buffet', true).find(
      '[data-testid="dish-image-panel"]'
    )
    expect(panel.classes()).toContain('from-orange')
    expect(panel.classes()).toContain('to-blue')
    expect(panel.classes()).not.toContain('bg-accent/20')
  })

  it('does not affect dish name/description/price legibility when highlighted', () => {
    const wrapper = mountCard(
      makeDish({ price: '179.00', incluido: false }),
      'carta',
      true
    )
    expect(wrapper.text()).toContain('Bora Bora Roll')
    expect(wrapper.text()).toContain('179.00')
  })

  // ── DB-driven option groups (Part C — "build your own" Ramen XL) ───────────
  it('shows no picker section for a dish with no configured option groups', () => {
    const wrapper = mountCard(makeDish({ optionGroups: [] }))
    expect(wrapper.findAll('.picker-stub')).toHaveLength(0)
  })

  it('renders one MenuSaucePicker per configured option group, in order', () => {
    const wrapper = mountCard(
      makeDish({
        optionGroups: [
          {
            key: 'noodle_base',
            name: { es: 'Base de fideo', en: 'Noodle base' },
            choices: [
              {
                id: 'c1',
                name: { es: 'Pollo', en: 'Chicken' },
                priceDelta: '0.00',
              },
              {
                id: 'c2',
                name: { es: 'Camarón cremoso', en: 'Creamy shrimp' },
                priceDelta: '0.00',
              },
            ],
          },
          {
            key: 'protein',
            name: { es: 'Proteína', en: 'Protein' },
            choices: [
              { id: 'c3', name: { es: 'Res', en: 'Beef' }, priceDelta: '0.00' },
            ],
          },
        ],
      })
    )
    const pickers = wrapper.findAll('.picker-stub')
    expect(pickers).toHaveLength(2)
    expect(pickers[0]?.attributes('data-label')).toBe('Base de fideo')
    expect(pickers[0]?.attributes('data-count')).toBe('2')
    expect(pickers[1]?.attributes('data-label')).toBe('Proteína')
    expect(pickers[1]?.attributes('data-count')).toBe('1')
  })
})
