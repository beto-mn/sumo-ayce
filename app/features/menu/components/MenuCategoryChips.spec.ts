import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { CategoryChip } from './MenuCategoryChips.vue'
import MenuCategoryChips from './MenuCategoryChips.vue'

// DB-sourced labels (name[locale]) — the chip renders these verbatim; no i18n.
const foodItems: CategoryChip[] = [
  { key: 'appetizers', label: 'Entradas' },
  { key: 'burgers', label: 'Hamburguesas' },
  { key: 'sandwiches', label: 'Sándwiches' },
  { key: 'wings', label: 'Alitas & Boneless' },
]

const stubs = {
  UiChip: {
    props: ['active'],
    template:
      '<button :class="{ active }" @click="$emit(\'click\')"><slot /></button>',
    emits: ['click'],
  },
}

function mountChips(
  items: CategoryChip[] = foodItems,
  activeCategory = 'appetizers'
) {
  return mount(MenuCategoryChips, {
    props: { items, activeCategory },
    global: { stubs },
  })
}

describe('MenuCategoryChips', () => {
  it('renders one chip per item in order, showing the DB-sourced label', () => {
    const buttons = mountChips().findAll('button')
    expect(buttons).toHaveLength(foodItems.length)
    expect(buttons[0]?.text()).toBe('Entradas')
    expect(buttons[1]?.text()).toBe('Hamburguesas')
    expect(buttons[2]?.text()).toBe('Sándwiches')
  })

  it('marks the single active chip (never null / no show-all)', () => {
    const wingsBtn = mountChips(foodItems, 'wings')
      .findAll('button')
      .find(b => b.text().includes('Alitas'))
    expect(wingsBtn?.classes()).toContain('active')
  })

  it('emits the clicked key', async () => {
    const wrapper = mountChips(foodItems, 'appetizers')
    await wrapper.findAll('button')[1]?.trigger('click')
    expect(wrapper.emitted('update:active-category')?.[0]).toEqual(['burgers'])
  })

  it('renders drink-group labels the same way (label passed in by the parent)', () => {
    const buttons = mountChips(
      [
        { key: 'jumbo_cocktails', label: 'Coctelería Jumbo' },
        { key: 'destilados', label: 'Destilados' },
      ],
      'jumbo_cocktails'
    ).findAll('button')
    expect(buttons[0]?.text()).toBe('Coctelería Jumbo')
    expect(buttons[1]?.text()).toBe('Destilados')
  })
})
