import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { DrinkGroupMeta, FullMenuDish } from '@/types/menu'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

import MenuDrinkSection from './MenuDrinkSection.vue'

function dish(over: Partial<FullMenuDish> & { id: string }): FullMenuDish {
  return {
    name: { es: 'Bebida', en: 'Drink' },
    description: { es: '', en: '' },
    imageUrl: null,
    badge: null,
    price: '99.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'sodas',
    drinkSubGroup: null,
    requiresSauce: false,
    featured: false,
    ...over,
  }
}

function sub(key: string, order: number) {
  return {
    key,
    name: { es: key, en: key },
    subtitle: null,
    promo: null,
    displayOrder: order,
  }
}

const drinkGroups: DrinkGroupMeta[] = [
  {
    key: 'sodas',
    name: { es: 'Refrescos y Bebidas', en: 'Sodas & Beverages' },
    displayOrder: 2,
    promo: null,
  },
  {
    key: 'beers',
    name: { es: 'Cervezas', en: 'Beers' },
    displayOrder: 3,
    promo: null,
  },
  {
    key: 'destilados',
    name: { es: 'Destilados', en: 'Spirits' },
    displayOrder: 4,
    promo: { es: 'Combo Mezcladores $189', en: 'Mixer Combo $189' },
  },
  {
    key: 'cantaritos_sumo_cups',
    name: { es: 'Cantaritos y Vasos Sumo', en: 'Cantaritos & Sumo Cups' },
    displayOrder: 1,
    promo: null,
  },
]

const stubs = {
  MenuDrinkCard: {
    props: ['name', 'imageUrl', 'price', 'badge', 'description'],
    template:
      '<div class="drink-card" :data-image="imageUrl ? \'yes\' : \'no\'"><span>{{ name }}</span><slot /></div>',
  },
  MenuSaucePicker: {
    props: ['options', 'pickerLabel'],
    template:
      '<div class="picker-stub" :data-count="options.length"><span v-for="o in options" :key="o.id" class="picker-opt">{{ o.label }}</span></div>',
  },
}

function mountSection(drinks: FullMenuDish[], activeGroup: string) {
  return mount(MenuDrinkSection, {
    props: { drinks, drinkGroups, activeGroup },
    global: { stubs },
  })
}

describe('MenuDrinkSection', () => {
  it('renders only the active group heading and its drinks', () => {
    const drinks = [
      dish({
        id: 'a',
        drinkGroup: 'sodas',
        name: { es: 'Refresco', en: 'Soda' },
      }),
      dish({
        id: 'b',
        drinkGroup: 'beers',
        name: { es: 'Indio', en: 'Indio' },
      }),
    ]
    const wrapper = mountSection(drinks, 'sodas')
    expect(wrapper.find('#drinks').exists()).toBe(true)
    // Heading is the DB group name (locale), not an i18n key.
    expect(wrapper.text()).toContain('Refrescos y Bebidas')
    expect(wrapper.text()).toContain('Refresco')
    expect(wrapper.text()).not.toContain('Indio')
  })

  it('renders the group-level promo exactly once for Destilados', () => {
    const drinks = [
      dish({
        id: 's1',
        drinkGroup: 'destilados',
        drinkSubGroup: sub('ron', 0),
        name: { es: 'Bacardí', en: 'Bacardí' },
      }),
      dish({
        id: 's2',
        drinkGroup: 'destilados',
        drinkSubGroup: sub('tequila', 5),
        name: { es: 'Cuervo', en: 'Cuervo' },
      }),
    ]
    const wrapper = mountSection(drinks, 'destilados')
    const promoCount = wrapper.text().split('Combo Mezcladores $189').length - 1
    expect(promoCount).toBe(1)
  })

  it('orders sub-groups by displayOrder (Caguamón first in beers)', () => {
    const drinks = [
      dish({
        id: 'b1',
        drinkGroup: 'beers',
        drinkSubGroup: sub('cerveza_nacional', 1),
        name: { es: 'Indio', en: 'Indio' },
      }),
      dish({
        id: 'b2',
        drinkGroup: 'beers',
        drinkSubGroup: sub('caguamon', 0),
        name: { es: 'Caguamón', en: 'Beer Bag' },
      }),
    ]
    const wrapper = mountSection(drinks, 'beers')
    const headers = wrapper.findAll('h3').map(h => h.text())
    expect(headers[0]).toBe('caguamon')
    expect(headers[1]).toBe('cerveza_nacional')
  })

  it('renders image cards at full span and no-image cards at half span', () => {
    const drinks = [
      dish({ id: 'i1', drinkGroup: 'sodas', imageUrl: '/x.webp' }),
      dish({ id: 'n1', drinkGroup: 'sodas', imageUrl: null }),
    ]
    const wrapper = mountSection(drinks, 'sodas')
    const cards = wrapper.findAll('.drink-card')
    const imageCard = cards.find(c => c.attributes('data-image') === 'yes')
    const noImageCard = cards.find(c => c.attributes('data-image') === 'no')
    expect(imageCard?.classes()).toContain('col-span-2')
    expect(noImageCard?.classes()).toContain('col-span-1')
  })

  it('mounts the flavour picker for the consolidated Vaso Sumo card', () => {
    const drinks = [
      dish({
        id: 'v1',
        drinkGroup: 'cantaritos_sumo_cups',
        name: { es: 'Vaso Sumo', en: 'Sumo Cup' },
      }),
      dish({
        id: 'c1',
        drinkGroup: 'cantaritos_sumo_cups',
        name: { es: 'Cantarito Fest', en: 'Cantarito Fest' },
      }),
    ]
    const wrapper = mountSection(drinks, 'cantaritos_sumo_cups')
    expect(wrapper.findAll('.picker-stub')).toHaveLength(1)
  })

  it("offers SIX Vaso Sumo bases including Jack Daniel's", () => {
    const drinks = [
      dish({
        id: 'v1',
        drinkGroup: 'cantaritos_sumo_cups',
        name: { es: 'Vaso Sumo', en: 'Sumo Cup' },
      }),
    ]
    const picker = mountSection(drinks, 'cantaritos_sumo_cups').find(
      '.picker-stub'
    )
    expect(picker.attributes('data-count')).toBe('6')
    const labels = picker.findAll('.picker-opt').map(o => o.text())
    expect(labels).toEqual([
      'menu.vaso_sumo.flavor.ron',
      'menu.vaso_sumo.flavor.tequila',
      'menu.vaso_sumo.flavor.vodka',
      'menu.vaso_sumo.flavor.whisky',
      'menu.vaso_sumo.flavor.new_mix',
      'menu.vaso_sumo.flavor.jack_daniels',
    ])
  })
})
