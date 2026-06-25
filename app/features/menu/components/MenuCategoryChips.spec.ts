import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuCategory } from '@/types/menu'
import MenuCategoryChips from './MenuCategoryChips.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    displayOrder: 0,
    dishes: [],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    displayOrder: 1,
    dishes: [],
  },
]

const stubs = {
  UiChip: {
    props: ['active'],
    template:
      '<button :class="{ active }" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
}

function mountChips(activeCategory: string | null = null) {
  return mount(MenuCategoryChips, {
    props: { categories, activeCategory },
    global: { stubs },
  })
}

describe('MenuCategoryChips', () => {
  it('renders without crashing', () => {
    const wrapper = mountChips()
    expect(wrapper.exists()).toBe(true)
  })

  it('renders one chip per category', () => {
    const wrapper = mountChips()
    expect(wrapper.findAll('button')).toHaveLength(categories.length)
  })

  it('marks the active chip with active prop', () => {
    const wrapper = mountChips('wings')
    const buttons = wrapper.findAll('button')
    const wingsBtn = buttons.find(b => b.text().includes('menu.category.wings'))
    expect(wingsBtn?.classes()).toContain('active')
  })

  it('emits update:active-category with the clicked key (US1 SC2 — category filter)', async () => {
    const wrapper = mountChips(null)
    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')
    const emitted = wrapper.emitted('update:active-category')
    expect(emitted).toBeTruthy()
    expect(emitted?.[0]).toEqual(['cold_rolls'])
  })

  it('emits null when clicking the already-active chip (toggle off)', async () => {
    const wrapper = mountChips('cold_rolls')
    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')
    const emitted = wrapper.emitted('update:active-category')
    expect(emitted?.[0]).toEqual([null])
  })

  it('renders a drinks chip when hasDrinks is true', () => {
    const wrapper = mount(MenuCategoryChips, {
      props: { categories, activeCategory: null, hasDrinks: true },
      global: { stubs },
    })
    expect(wrapper.findAll('button')).toHaveLength(categories.length + 1)
  })
})
