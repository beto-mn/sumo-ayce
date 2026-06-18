import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Nav from './Nav.vue'

describe('Nav', () => {
  it('renders a nav element with the default SUMO logo block', () => {
    const wrapper = mount(Nav)
    const root = wrapper.get('nav')
    expect(root.element.tagName).toBe('NAV')
    expect(root.classes()).toContain('sticky')
    expect(wrapper.text()).toContain('SUMO')
    expect(wrapper.text()).toContain('ALL YOU CAN EAT')
  })

  it('applies the scope-express class when accent="express"', () => {
    const wrapper = mount(Nav, { props: { accent: 'express' } })
    expect(wrapper.get('nav').classes()).toContain('scope-express')
  })

  it('toggles the mobile menu when the burger button is activated', async () => {
    const wrapper = mount(Nav, {
      slots: { links: '<a href="/menu">Menú</a>' },
    })
    const burger = wrapper.get('button[aria-label="Abrir menú"]')
    expect(burger.attributes('aria-expanded')).toBe('false')
    await burger.trigger('click')
    expect(burger.attributes('aria-expanded')).toBe('true')
  })
})
