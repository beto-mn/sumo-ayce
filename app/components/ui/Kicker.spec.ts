import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Kicker from './Kicker.vue'

describe('Kicker', () => {
  it('renders ink-on-bg by default with the -2deg rotation', () => {
    const wrapper = mount(Kicker, { slots: { default: 'NUEVO' } })
    const classes = wrapper.classes()
    expect(wrapper.text()).toContain('NUEVO')
    expect(classes).toContain('bg-ink')
    expect(classes).toContain('text-bg')
    expect(wrapper.attributes('style')).toContain('rotate(-2deg)')
  })

  it('swaps to accent surface when tone="accent"', () => {
    const wrapper = mount(Kicker, {
      props: { tone: 'accent' },
      slots: { default: 'TOP' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-accent')
    expect(classes).not.toContain('bg-ink')
  })

  it.each([
    ['orange', 'bg-orange'],
    ['pink', 'bg-pink'],
    ['blue', 'bg-blue'],
    ['yellow', 'bg-yellow'],
  ] as const)('supports the %s section tone', (tone, expected) => {
    const wrapper = mount(Kicker, {
      props: { tone },
      slots: { default: 'TAG' },
    })
    expect(wrapper.classes()).toContain(expected)
  })

  it('uses ink text on the yellow tone for contrast (non-Express sections)', () => {
    const wrapper = mount(Kicker, {
      props: { tone: 'yellow' },
      slots: { default: 'TAG' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-yellow')
    expect(classes).toContain('text-ink')
    expect(classes).not.toContain('text-bg')
  })

  it('uses uppercase display typography and the kicker text size', () => {
    const wrapper = mount(Kicker, { slots: { default: 'tag' } })
    const classes = wrapper.classes()
    expect(classes).toContain('font-disp')
    expect(classes).toContain('uppercase')
    expect(classes).toContain('text-kicker')
  })
})
