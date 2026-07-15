import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { PrimarySelection } from '@/features/menu/menu-sets'
import MenuTypeToggle from './MenuTypeToggle.vue'

vi.stubGlobal('useI18n', () => ({
  t: (k: string) => k,
  locale: { value: 'es' },
}))

function mountToggle(activeSelection: PrimarySelection = 'ayce') {
  return mount(MenuTypeToggle, { props: { activeSelection } })
}

describe('MenuTypeToggle', () => {
  it('renders four primary-selection buttons (AYCE, Express, Bebidas, Kids)', () => {
    const labels = mountToggle()
      .findAll('button')
      .map(b => b.text())
    expect(labels).toEqual([
      'menu.type.ayce',
      'menu.type.express',
      'menu.type.drinks',
      'menu.type.kids',
    ])
  })

  it('groups AYCE + Express into ONE segmented pill; Bebidas and Kids stand alone', () => {
    const wrapper = mountToggle()
    // The [role=group] pill contains exactly the AYCE + Express segments.
    const pill = wrapper.get('[role="group"]')
    expect(pill.classes()).toContain('rounded-pop-full')
    expect(pill.classes()).toContain('border-pop')
    expect(pill.classes()).toContain('shadow-pop-sm')
    const pillButtons = pill.findAll('button')
    expect(pillButtons).toHaveLength(2)
    expect(pillButtons.map(b => b.text())).toEqual([
      'menu.type.ayce',
      'menu.type.express',
    ])
    // Segments inside the pill have no own border (the pill draws it).
    for (const button of pillButtons) {
      expect(button.classes()).toContain('flex-1')
      expect(button.classes()).toContain('min-h-[44px]')
      expect(button.classes()).not.toContain('border-pop')
    }
  })

  it('renders Bebidas and Kids as standalone bordered pill buttons', () => {
    const buttons = mountToggle().findAll('button')
    const bebidas = buttons[2]
    const kids = buttons[3]
    for (const button of [bebidas, kids]) {
      expect(button?.classes()).toContain('border-pop')
      expect(button?.classes()).toContain('rounded-pop-full')
      expect(button?.classes()).toContain('shadow-pop-sm')
      expect(button?.classes()).toContain('min-h-[44px]')
    }
  })

  it('stacks full-width on phone, wraps natural-width pills at sm+ (tablet), one row at md+', () => {
    const wrapper = mountToggle()
    const root = wrapper.get('div')
    // Phone (< sm): vertical stack, full width.
    expect(root.classes()).toContain('flex-col')
    expect(root.classes()).toContain('w-full')
    // Tablet/desktop (sm+): horizontal row that wraps whole pills at natural width.
    expect(root.classes()).toContain('sm:flex-row')
    expect(root.classes()).toContain('sm:flex-wrap')
    expect(root.classes()).toContain('sm:w-auto')
    expect(root.classes()).not.toContain('overflow-x-auto')
    // The AYCE|Express pill is full-width on phone, natural (inline) at sm+.
    const pill = wrapper.get('[role="group"]')
    expect(pill.classes()).toContain('w-full')
    expect(pill.classes()).toContain('sm:w-auto')
    // Standalone Bebidas/Kids buttons: full-width row on phone, natural at sm+.
    const standalone = wrapper.findAll('button').slice(2)
    for (const button of standalone) {
      expect(button.classes()).toContain('w-full')
      expect(button.classes()).toContain('sm:w-auto')
    }
    for (const button of wrapper.findAll('button')) {
      expect(button.classes()).toContain('text-kicker')
      expect(button.classes()).not.toContain('text-[10px]')
      // Labels never cram: they stay on one line (whole-pill wrap, not text wrap).
      expect(button.classes()).toContain('whitespace-nowrap')
      // Native <button> gets an explicit pointer cursor on hover.
      expect(button.classes()).toContain('cursor-pointer')
    }
  })

  it('lets the AYCE|Express segments fill the pill on phone but go natural at sm+', () => {
    const segments = mountToggle().get('[role="group"]').findAll('button')
    for (const segment of segments) {
      expect(segment.classes()).toContain('flex-1')
      expect(segment.classes()).toContain('sm:flex-none')
    }
  })

  it('marks the AYCE button active when selection is ayce', () => {
    const buttons = mountToggle('ayce').findAll('button')
    expect(buttons[0]?.attributes('aria-pressed')).toBe('true')
    expect(buttons[1]?.attributes('aria-pressed')).toBe('false')
    expect(buttons[2]?.attributes('aria-pressed')).toBe('false')
    expect(buttons[3]?.attributes('aria-pressed')).toBe('false')
  })

  it('marks the Express button active when selection is express', () => {
    expect(
      mountToggle('express').findAll('button')[1]?.attributes('aria-pressed')
    ).toBe('true')
  })

  it('marks the Bebidas button active when selection is drinks', () => {
    expect(
      mountToggle('drinks').findAll('button')[2]?.attributes('aria-pressed')
    ).toBe('true')
  })

  it('marks the Kids button active with the same ink treatment as Bebidas when selection is kids', () => {
    const kids = mountToggle('kids').findAll('button')[3]
    const bebidasActive = mountToggle('drinks').findAll('button')[2]
    expect(kids?.attributes('aria-pressed')).toBe('true')
    // Kids shares Bebidas' ink/black active fill (both are cross-cutting views).
    expect(kids?.classes()).toContain('bg-ink')
    expect(kids?.classes()).not.toContain('bg-green')
    expect(bebidasActive?.classes()).toContain('bg-ink')
  })

  it('emits update:selection with the clicked value', async () => {
    const wrapper = mountToggle('ayce')
    const buttons = wrapper.findAll('button')
    await buttons[1]?.trigger('click')
    await buttons[2]?.trigger('click')
    await buttons[3]?.trigger('click')
    expect(wrapper.emitted('update:selection')?.[0]).toEqual(['express'])
    expect(wrapper.emitted('update:selection')?.[1]).toEqual(['drinks'])
    expect(wrapper.emitted('update:selection')?.[2]).toEqual(['kids'])
  })

  it('renders the #modality slot BETWEEN the type pill and the standalone buttons', () => {
    const wrapper = mount(MenuTypeToggle, {
      props: { activeSelection: 'ayce' },
      slots: { modality: '<div class="modality-slot" />' },
    })
    const html = wrapper.html()
    const pillIdx = html.indexOf('role="group"')
    const slotIdx = html.indexOf('modality-slot')
    const bebidasIdx = html.indexOf('menu.type.drinks')
    expect(slotIdx).toBeGreaterThan(pillIdx)
    expect(slotIdx).toBeLessThan(bebidasIdx)
  })
})
