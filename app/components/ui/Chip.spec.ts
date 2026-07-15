import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Chip from './Chip.vue'

describe('Chip', () => {
  it('renders inactive state with panel surface by default', () => {
    const wrapper = mount(Chip, { slots: { default: 'Filter' } })
    const classes = wrapper.classes()
    expect(wrapper.text()).toContain('Filter')
    expect(classes).toContain('bg-panel')
    expect(classes).toContain('text-ink')
    expect(classes).not.toContain('bg-ink')
  })

  it('swaps to ink surface when active=true', () => {
    const wrapper = mount(Chip, {
      props: { active: true },
      slots: { default: 'On' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-ink')
    expect(classes).toContain('text-bg')
  })

  it('renders a button element and emits click when activated', async () => {
    const wrapper = mount(Chip, { slots: { default: 'Pulsable' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('shows a pointer cursor for the clickable (button) variant but not the span variant', () => {
    const asButton = mount(Chip, { slots: { default: 'Tap' } })
    expect(asButton.classes()).toContain('cursor-pointer')
    const asSpan = mount(Chip, {
      props: { as: 'span' },
      slots: { default: 'Static' },
    })
    expect(asSpan.classes()).not.toContain('cursor-pointer')
  })
})
