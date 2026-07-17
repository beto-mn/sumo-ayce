import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { PickerOption } from '@/features/menu/types'
import MenuSaucePicker from './MenuSaucePicker.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const SAUCE_OPTIONS: PickerOption[] = [
  { id: 's3', label: 'Habanero', spiceLevel: 4 },
  { id: 's1', label: 'Honey Mustard', spiceLevel: 0 },
  { id: 's2', label: 'Buffalo', spiceLevel: 2 },
]

const FLAVOR_OPTIONS: PickerOption[] = [
  { id: 'ron', label: 'Ron' },
  { id: 'tequila', label: 'Tequila' },
  { id: 'vodka', label: 'Vodka' },
]

function mountPicker(props: {
  options: PickerOption[]
  pickerLabel?: string
  sortBySpice?: boolean
}) {
  return mount(MenuSaucePicker, {
    props: { pickerLabel: 'menu.dish.sauce_required', ...props },
  })
}

describe('MenuSaucePicker — sauce mode', () => {
  it('renders every option and sorts by spice when sortBySpice is set', () => {
    const buttons = mountPicker({
      options: SAUCE_OPTIONS,
      sortBySpice: true,
    }).findAll('button')
    expect(buttons).toHaveLength(3)
    expect(buttons[0]?.text()).toContain('Honey Mustard') // spice 0 first
    expect(buttons[2]?.text()).toContain('Habanero') // spice 4 last
  })

  it('gives each option button a pointer cursor on hover', () => {
    const buttons = mountPicker({ options: SAUCE_OPTIONS }).findAll('button')
    for (const button of buttons)
      expect(button.classes()).toContain('cursor-pointer')
  })

  it('shows the chili indicator only for spiceLevel >= 3', () => {
    const buttons = mountPicker({
      options: SAUCE_OPTIONS,
      sortBySpice: true,
    }).findAll('button')
    const habanero = buttons.find(b => b.text().includes('Habanero'))
    const honey = buttons.find(b => b.text().includes('Honey Mustard'))
    expect(habanero?.find('[aria-label]').exists()).toBe(true)
    expect(honey?.find('[aria-label]').exists()).toBe(false)
  })
})

describe('MenuSaucePicker — flavour mode (Vaso Sumo)', () => {
  it('renders flavour options with no spice indicator', () => {
    const wrapper = mountPicker({
      options: FLAVOR_OPTIONS,
      // DB-driven group label (feature 027 Part E) — not an i18n key, since
      // Vaso Sumo's flavors are now sourced from `menu_item_option_groups`.
      pickerLabel: 'Sabor',
    })
    expect(wrapper.findAll('button')).toHaveLength(3)
    expect(wrapper.find('[aria-label]').exists()).toBe(false)
  })

  it('renders the picker label heading', () => {
    const wrapper = mountPicker({
      options: FLAVOR_OPTIONS,
      // DB-driven group label (feature 027 Part E) — not an i18n key, since
      // Vaso Sumo's flavors are now sourced from `menu_item_option_groups`.
      pickerLabel: 'Sabor',
    })
    expect(wrapper.text()).toContain('Sabor')
  })

  it('pre-selects the first option (always a valid single-active choice)', () => {
    const buttons = mountPicker({ options: FLAVOR_OPTIONS }).findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('false')
  })

  it('moves the active selection on click (single active, never empty)', async () => {
    const wrapper = mountPicker({ options: FLAVOR_OPTIONS })
    const buttons = wrapper.findAll('button')
    await buttons[2]?.trigger('click')
    expect(buttons[2]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('false')
    // clicking the active one keeps it active (no deselect to empty)
    await buttons[2]?.trigger('click')
    expect(buttons[2]?.attributes('aria-pressed')).toBe('true')
  })
})
