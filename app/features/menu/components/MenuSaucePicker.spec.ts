import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { FullMenuSauce } from '@/types/menu'
import MenuSaucePicker from './MenuSaucePicker.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

const SAUCES: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    spiceLevel: 0,
  },
  { id: 's2', name: { es: 'Buffalo', en: 'Buffalo' }, spiceLevel: 2 },
  { id: 's3', name: { es: 'Habanero', en: 'Habanero' }, spiceLevel: 4 },
  { id: 's4', name: { es: 'Thai Chili', en: 'Thai Chili' }, spiceLevel: 3 },
]

function mountPicker(sauces = SAUCES) {
  return mount(MenuSaucePicker, {
    props: { sauces },
    global: { stubs: {} },
  })
}

describe('MenuSaucePicker', () => {
  it('renders all sauces', () => {
    const wrapper = mountPicker()
    expect(wrapper.findAll('button')).toHaveLength(4)
  })

  it('renders sauces in ascending spiceLevel order', () => {
    const wrapper = mountPicker()
    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.text()).toContain('Honey Mustard')
    expect(buttons[1]?.text()).toContain('Buffalo')
  })

  it('shows spice indicator for spiceLevel >= 3', () => {
    const wrapper = mountPicker()
    const buttons = wrapper.findAll('button')
    const habaneroBtn = buttons.find(b => b.text().includes('Habanero'))
    expect(habaneroBtn?.find('[aria-label]').exists()).toBe(true)
  })

  it('does not show spice indicator for spiceLevel < 3', () => {
    const wrapper = mountPicker()
    const buttons = wrapper.findAll('button')
    const honeymustardBtn = buttons.find(b =>
      b.text().includes('Honey Mustard')
    )
    expect(honeymustardBtn?.find('[aria-label]').exists()).toBe(false)
  })

  it('highlights a sauce when clicked', async () => {
    const wrapper = mountPicker()
    const btn = wrapper.findAll('button')[0]
    await btn?.trigger('click')
    expect(btn?.classes()).toContain('bg-ink')
  })

  it('deselects a sauce when clicked again', async () => {
    const wrapper = mountPicker()
    const btn = wrapper.findAll('button')[0]
    await btn?.trigger('click')
    await btn?.trigger('click')
    expect(btn?.classes()).not.toContain('bg-ink')
  })
})
