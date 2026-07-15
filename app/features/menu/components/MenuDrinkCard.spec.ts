import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MenuDrinkCard from './MenuDrinkCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => (k === 'menu.dish.price_prefix' ? '$' : k),
  locale: { value: 'es' },
}))

function mountCard(
  props: Partial<{
    name: string
    description: string
    badge: string | null
    price: string | null
    imageUrl: string | null
  }> = {}
) {
  return mount(MenuDrinkCard, {
    props: {
      name: 'Vaso Sumo',
      description: 'Vaso SUMO 960 ml.',
      badge: null,
      price: '159.00',
      imageUrl: 'https://blob.test/menu/drinks/sumo_cup.webp',
      ...props,
    },
  })
}

describe('MenuDrinkCard', () => {
  it('renders the drink name and description', () => {
    const text = mountCard().text()
    expect(text).toContain('Vaso Sumo')
    expect(text).toContain('Vaso SUMO 960 ml.')
  })

  it('renders the price with the prefix', () => {
    expect(mountCard({ price: '159.00' }).text()).toContain('$159.00')
  })

  it('renders no price element when price is null', () => {
    const wrapper = mountCard({ price: null })
    expect(wrapper.text()).not.toContain('$')
  })

  it('renders the badge only when provided', () => {
    expect(mountCard({ badge: 'Base a elegir' }).text()).toContain(
      'Base a elegir'
    )
    expect(
      mountCard({ badge: null })
        .findAll('span')
        .some(s => s.classes().includes('text-soft'))
    ).toBe(false)
  })

  it('renders the image block when imageUrl is set (image itself static)', () => {
    const wrapper = mountCard({ imageUrl: '/x.webp' })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/x.webp')
    // The image is now static — the zoom moved to the card root.
    expect(img.classes()).not.toContain('hover:scale-110')
    expect(img.classes()).not.toContain('hover:scale-105')
  })

  it('applies the hover-zoom to the whole CARD root (not the image)', () => {
    const root = mountCard({ imageUrl: '/x.webp' }).get('div')
    const cls = root.classes()
    // Hover-zoom gated by hover-capability + reduced-motion; hover:z-10 lifts the
    // scaled card above its neighbors in the grid.
    expect(cls).toContain('hover:scale-105')
    expect(cls).toContain('hover:z-10')
    expect(cls).toContain('motion-reduce:transform-none')
    expect(cls).toContain('transition-transform')
  })

  it('renders NO image block when imageUrl is null (drives the half-width no-image card)', () => {
    const wrapper = mountCard({ imageUrl: null })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.h-44').exists()).toBe(false)
  })

  it('renders default slot content (e.g. the Vaso Sumo flavour picker)', () => {
    const wrapper = mount(MenuDrinkCard, {
      props: {
        name: 'Vaso Sumo',
        description: '',
        badge: null,
        price: '159.00',
        imageUrl: null,
      },
      slots: { default: '<div class="flavor-picker-stub" />' },
    })
    expect(wrapper.find('.flavor-picker-stub').exists()).toBe(true)
  })
})
