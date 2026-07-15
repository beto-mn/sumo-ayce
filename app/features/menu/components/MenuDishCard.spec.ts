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
    ...overrides,
  }
}

function mountCard(
  dish: FullMenuDish,
  modality: 'buffet' | 'carta' = 'buffet'
) {
  return mount(MenuDishCard, { props: { dish, modality } })
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
    // 64px star, pinned top-left clear of the top-right pink badge.
    expect(badge.classes()).toContain('size-16')
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
})
