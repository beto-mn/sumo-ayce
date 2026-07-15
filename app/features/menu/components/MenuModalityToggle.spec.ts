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

  it('is ONE segmented pill: full-width on phone, natural width at sm+ (no scroll, no font shrink, no stacking)', () => {
    const wrapper = mountToggle()
    // Single pill = the root (no scroll wrapper).
    const pill = wrapper.get('[role="group"]')
    expect(pill.classes()).toContain('rounded-pop-full')
    expect(pill.classes()).toContain('border-pop')
    expect(pill.classes()).toContain('shadow-pop-sm')
    // Phone (< sm): fills the row (matching the stacked nav); sm+: natural inline width.
    expect(pill.classes()).toContain('w-full')
    expect(pill.classes()).toContain('sm:w-auto')
    expect(pill.classes()).toContain('sm:inline-flex')
    expect(pill.classes()).not.toContain('overflow-x-auto')
    expect(pill.classes()).not.toContain('flex-col')
    for (const button of wrapper.findAll('button')) {
      // Segments fill the pill on phone (flex-1), natural width at sm+.
      expect(button.classes()).toContain('flex-1')
      expect(button.classes()).toContain('sm:flex-none')
      // Original font size kept (no mobile shrink); label stays on one line.
      expect(button.classes()).toContain('text-kicker')
      expect(button.classes()).not.toContain('text-[10px]')
      expect(button.classes()).toContain('whitespace-nowrap')
      // Native <button> gets an explicit pointer cursor on hover.
      expect(button.classes()).toContain('cursor-pointer')
      expect(button.classes()).toContain('min-h-[44px]')
      expect(button.classes()).toContain('items-center')
      expect(button.classes()).not.toContain('border-pop')
    }
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

  it('labels the buffet button "All You Can Eat" and the carta button "Carta" (ES)', () => {
    const labels: Record<string, string> = {
      'menu.modality.buffet': 'All You Can Eat',
      'menu.modality.carta': 'Carta',
    }
    vi.stubGlobal('useI18n', () => ({
      t: (k: string) => labels[k] ?? k,
      locale: { value: 'es' },
    }))
    const buttons = mountToggle('buffet').findAll('button')
    expect(buttons[0]?.text()).toBe('All You Can Eat')
    expect(buttons[1]?.text()).toBe('Carta')
    vi.stubGlobal('useI18n', () => ({
      t: (k: string) => k,
      locale: { value: 'es' },
    }))
  })

  it('labels the carta button "Menu" in English', () => {
    const labels: Record<string, string> = {
      'menu.modality.buffet': 'All You Can Eat',
      'menu.modality.carta': 'Menu',
    }
    vi.stubGlobal('useI18n', () => ({
      t: (k: string) => labels[k] ?? k,
      locale: { value: 'en' },
    }))
    const buttons = mountToggle('carta').findAll('button')
    expect(buttons[1]?.text()).toBe('Menu')
    vi.stubGlobal('useI18n', () => ({
      t: (k: string) => k,
      locale: { value: 'es' },
    }))
  })
})
