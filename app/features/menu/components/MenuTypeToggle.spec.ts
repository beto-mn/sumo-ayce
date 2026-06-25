import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import MenuTypeToggle from './MenuTypeToggle.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

function mountToggle(activeType: 'ayce' | 'express' = 'ayce') {
  return mount(MenuTypeToggle, { props: { activeType } })
}

describe('MenuTypeToggle', () => {
  it('renders without crashing', () => {
    expect(mountToggle().exists()).toBe(true)
  })

  it('renders two buttons', () => {
    const wrapper = mountToggle()
    expect(wrapper.findAll('button')).toHaveLength(2)
  })

  it('marks the ayce button as active when activeType is ayce', () => {
    const wrapper = mountToggle('ayce')
    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('false')
  })

  it('marks the express button as active when activeType is express', () => {
    const wrapper = mountToggle('express')
    const buttons = wrapper.findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('false')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('true')
  })

  it('emits update:active-type with ayce when the ayce button is clicked', async () => {
    const wrapper = mountToggle('express')
    const buttons = wrapper.findAll('button')
    await buttons[0]?.trigger('click')
    expect(wrapper.emitted('update:active-type')?.[0]).toEqual(['ayce'])
  })

  it('emits update:active-type with express when the express button is clicked', async () => {
    const wrapper = mountToggle('ayce')
    const buttons = wrapper.findAll('button')
    await buttons[1]?.trigger('click')
    expect(wrapper.emitted('update:active-type')?.[0]).toEqual(['express'])
  })
})
