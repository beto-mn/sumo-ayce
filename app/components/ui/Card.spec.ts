import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Card from './Card.vue'

describe('Card', () => {
  it('renders default state with panel surface and large shadow', () => {
    const wrapper = mount(Card, { slots: { default: 'Card body copy' } })
    const classes = wrapper.classes()
    expect(wrapper.text()).toContain('Card body copy')
    expect(classes).toContain('bg-panel')
    expect(classes).toContain('shadow-pop')
    expect(classes).not.toContain('scope-express')
  })

  it('applies the scope-express class when accent="express"', () => {
    const wrapper = mount(Card, {
      props: { accent: 'express' },
      slots: { default: 'Express body' },
    })
    expect(wrapper.classes()).toContain('scope-express')
  })

  it('switches to the secondary surface and small shadow under tone="bg2" + shadowSize="sm"', () => {
    const wrapper = mount(Card, {
      props: { tone: 'bg2', shadowSize: 'sm' },
      slots: { default: 'Alt surface' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-bg2')
    expect(classes).toContain('shadow-pop-sm')
    expect(classes).not.toContain('bg-panel')
  })
})
