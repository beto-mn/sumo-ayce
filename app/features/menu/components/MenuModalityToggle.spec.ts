import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MenuModalityToggle from './MenuModalityToggle.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

function mountToggle(activeModality: 'buffet' | 'carta' = 'buffet') {
  return mount(MenuModalityToggle, { props: { activeModality } })
}

describe('MenuModalityToggle', () => {
  it('renders without crashing', () => {
    expect(mountToggle().exists()).toBe(true)
  })

  it('renders two buttons', () => {
    const wrapper = mountToggle()
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('marks buffet button as active when activeModality is buffet', () => {
    const wrapper = mountToggle('buffet')
    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('false')
  })

  it('marks carta button as active when activeModality is carta', () => {
    const wrapper = mountToggle('carta')
    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('false')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('true')
  })

  it('emits update:active-modality with buffet when buffet button is clicked', async () => {
    const wrapper = mountToggle('carta')
    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('update:active-modality')?.[0]).toEqual(['buffet'])
  })

  it('emits update:active-modality with carta when carta button is clicked', async () => {
    const wrapper = mountToggle('buffet')
    const buttons = wrapper.findAll('button')
    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('update:active-modality')?.[0]).toEqual(['carta'])
  })
})
