import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Sticker from './Sticker.vue'

describe('Sticker', () => {
  it('renders default yellow surface with the -8deg rotation', () => {
    const wrapper = mount(Sticker, { slots: { default: 'Promo' } })
    const classes = wrapper.classes()
    expect(wrapper.text()).toContain('Promo')
    expect(classes).toContain('bg-yellow')
    expect(wrapper.attributes('style')).toContain('rotate(-8deg)')
  })

  it('swaps to pink surface when tone="pink"', () => {
    const wrapper = mount(Sticker, {
      props: { tone: 'pink' },
      slots: { default: 'Hot' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-pink')
    expect(classes).toContain('text-bg')
    expect(classes).not.toContain('bg-yellow')
  })

  it('swaps to orange surface when tone="orange"', () => {
    const wrapper = mount(Sticker, {
      props: { tone: 'orange' },
      slots: { default: '$269' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-orange')
    expect(classes).toContain('text-bg')
    expect(classes).not.toContain('bg-yellow')
  })

  it('swaps to blue surface when tone="blue" (Express accent)', () => {
    const wrapper = mount(Sticker, {
      props: { tone: 'blue' },
      slots: { default: 'Formato compacto' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-blue')
    expect(classes).toContain('text-bg')
    expect(classes).not.toContain('bg-pink')
  })

  it('swaps to green surface when tone="green"', () => {
    const wrapper = mount(Sticker, {
      props: { tone: 'green' },
      slots: { default: 'Cumpleaños' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-green')
    expect(classes).toContain('text-bg')
    expect(classes).not.toContain('bg-yellow')
  })

  it('honors a custom rotate prop on the inline transform', () => {
    const wrapper = mount(Sticker, {
      props: { rotate: 4 },
      slots: { default: 'Nuevo' },
    })
    expect(wrapper.attributes('style')).toContain('rotate(4deg)')
  })
})
