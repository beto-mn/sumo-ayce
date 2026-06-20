import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Marquee from './Marquee.vue'

describe('Marquee', () => {
  it('renders the slot content with the default 20s animation duration', () => {
    const wrapper = mount(Marquee, {
      slots: { default: '<span>Promo de la semana</span>' },
    })
    expect(wrapper.text()).toContain('Promo de la semana')
    const track = wrapper.get('.marquee-track')
    expect(track.attributes('style')).toContain('animation-duration: 20s')
    expect(wrapper.get('.marquee').classes()).toContain('pause-on-hover')
  })

  it('applies the slow speed duration when speed="slow"', () => {
    const wrapper = mount(Marquee, {
      props: { speed: 'slow' },
      slots: { default: 'lento' },
    })
    expect(wrapper.get('.marquee-track').attributes('style')).toContain(
      'animation-duration: 40s'
    )
  })

  it('keeps the first slot copy visible and hides the rest from screen readers', () => {
    const wrapper = mount(Marquee, {
      slots: { default: 'aviso' },
    })
    const copies = wrapper.findAll('.marquee-content')
    // Renders the SSR-safe default of several copies so the band is gap-free
    // before the client measures the exact count.
    expect(copies.length).toBeGreaterThanOrEqual(2)
    // The first copy is announced once; every duplicate is aria-hidden.
    expect(copies[0]?.attributes('aria-hidden')).toBeUndefined()
    for (const copy of copies.slice(1)) {
      expect(copy.attributes('aria-hidden')).toBe('true')
    }
  })

  it('defaults to the yellow tone', () => {
    const wrapper = mount(Marquee, { slots: { default: 'amarillo' } })
    const root = wrapper.get('.marquee')
    expect(root.classes()).toContain('bg-yellow')
    expect(root.classes()).toContain('text-ink')
  })

  it('renders the dark ink tone when tone="ink"', () => {
    const wrapper = mount(Marquee, {
      props: { tone: 'ink' },
      slots: { default: 'oscuro' },
    })
    const root = wrapper.get('.marquee')
    expect(root.classes()).toContain('bg-ink')
    expect(root.classes()).toContain('text-bg')
    expect(root.classes()).not.toContain('bg-yellow')
  })

  it('reverses direction when direction="right"', () => {
    const wrapper = mount(Marquee, {
      props: { direction: 'right' },
      slots: { default: 'reverse' },
    })
    expect(wrapper.get('.marquee-track').attributes('style')).toContain(
      'animation-direction: reverse'
    )
  })
})
