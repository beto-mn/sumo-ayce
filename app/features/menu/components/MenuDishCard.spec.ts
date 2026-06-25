import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuDish, FullMenuSauce } from '@/types/menu'
import MenuDishCard from './MenuDishCard.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const stubs = {
  MenuSaucePicker: { template: '<div class="sauce-picker-stub" />' },
  NuxtImg: {
    props: ['src', 'alt', 'loading', 'width', 'height'],
    template:
      '<img :src="src" :alt="alt" :loading="loading" :width="width" :height="height" />',
  },
}

const SAUCES: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    spiceLevel: 0,
  },
]

function makeDish(overrides: Partial<FullMenuDish> = {}): FullMenuDish {
  return {
    id: 'd1',
    name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
    description: { es: 'Salmón fresco.', en: 'Fresh salmon.' },
    imageUrl: '/menu/ayce/bora_bora.webp',
    badge: null,
    price: null,
    incluido: true,
    drinkGroup: null,
    drinkSubGroup: null,
    requiresSauce: false,
    ...overrides,
  }
}

function mountCard(
  dish: FullMenuDish,
  modality: 'buffet' | 'carta' = 'buffet'
) {
  return mount(MenuDishCard, {
    props: { dish, sauces: SAUCES, modality },
    global: { stubs },
  })
}

describe('MenuDishCard', () => {
  it('renders dish name', () => {
    expect(mountCard(makeDish()).text()).toContain('Bora Bora Roll')
  })

  it('renders dish description', () => {
    expect(mountCard(makeDish()).text()).toContain('Salmón fresco.')
  })

  it('renders dish image when imageUrl is present', () => {
    const img = mountCard(makeDish()).find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/menu/ayce/bora_bora.webp')
  })

  it('renders no image container when imageUrl is null', () => {
    const wrapper = mountCard(makeDish({ imageUrl: null }))
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.relative.h-44').exists()).toBe(false)
  })

  it('shows badge when non-null', () => {
    const wrapper = mountCard(makeDish({ badge: { es: 'Nuevo', en: 'New' } }))
    expect(wrapper.text()).toContain('Nuevo')
  })

  it('does not show badge when null', () => {
    const wrapper = mountCard(makeDish({ badge: null }))
    expect(wrapper.find('span.absolute').exists()).toBe(false)
  })

  it('shows "Incluido" in buffet modality for included dish', () => {
    const wrapper = mountCard(makeDish({ incluido: true }), 'buffet')
    expect(wrapper.text()).toContain('menu.dish.incluido')
  })

  it('does not show price in buffet modality', () => {
    const wrapper = mountCard(
      makeDish({ price: '128.00', incluido: false }),
      'buffet'
    )
    expect(wrapper.text()).not.toContain('128.00')
  })

  it('shows price in carta modality', () => {
    const wrapper = mountCard(
      makeDish({ price: '128.00', incluido: false }),
      'carta'
    )
    expect(wrapper.text()).toContain('128.00')
  })

  it('mounts MenuSaucePicker when requiresSauce is true', () => {
    const wrapper = mountCard(makeDish({ requiresSauce: true }))
    expect(wrapper.find('.sauce-picker-stub').exists()).toBe(true)
  })

  it('does not mount MenuSaucePicker when requiresSauce is false', () => {
    const wrapper = mountCard(makeDish({ requiresSauce: false }))
    expect(wrapper.find('.sauce-picker-stub').exists()).toBe(false)
  })
})
