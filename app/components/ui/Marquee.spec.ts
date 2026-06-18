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

  it('marks the duplicated track copy as aria-hidden for screen readers', () => {
    const wrapper = mount(Marquee, {
      slots: { default: 'aviso' },
    })
    const copies = wrapper.findAll('.marquee-content')
    expect(copies).toHaveLength(2)
    expect(copies[1]?.attributes('aria-hidden')).toBe('true')
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
