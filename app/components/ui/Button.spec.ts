import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Button from './Button.vue'

describe('Button', () => {
  it('renders the slot content with the primary variant by default', () => {
    const wrapper = mount(Button, { slots: { default: 'Reservar' } })
    const classes = wrapper.classes()
    expect(wrapper.text()).toContain('Reservar')
    expect(classes).toContain('bg-accent')
    expect(classes).toContain('text-bg')
    expect(wrapper.attributes('type')).toBe('button')
  })

  it('switches to ink surface when variant="ink" is set', () => {
    const wrapper = mount(Button, {
      props: { variant: 'ink' },
      slots: { default: 'Continuar' },
    })
    const classes = wrapper.classes()
    expect(classes).toContain('bg-ink')
    expect(classes).not.toContain('bg-accent')
  })

  it('emits click when the user activates the button', async () => {
    const wrapper = mount(Button, { slots: { default: 'Enviar' } })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeTruthy()
  })

  it('exposes aria-busy and disables the button while loading', () => {
    const wrapper = mount(Button, {
      props: { loading: true },
      slots: { default: 'Cargando' },
    })
    expect(wrapper.attributes('aria-busy')).toBe('true')
    expect(wrapper.attributes('disabled')).toBeDefined()
  })
})
