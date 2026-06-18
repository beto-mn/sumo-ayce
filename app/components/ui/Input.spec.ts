import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Input from './Input.vue'

describe('Input', () => {
  it('renders the input with placeholder, name, and panel surface', () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', name: 'email', placeholder: 'tu@correo.mx' },
    })
    const input = wrapper.get('input')
    expect(input.attributes('placeholder')).toBe('tu@correo.mx')
    expect(input.attributes('name')).toBe('email')
    expect(input.classes()).toContain('bg-panel')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mount(Input, {
      props: { modelValue: '', name: 'q' },
    })
    await wrapper.get('input').setValue('hola')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hola'])
  })

  it('renders the error message and marks the field as invalid for screen readers', () => {
    const wrapper = mount(Input, {
      props: {
        modelValue: '',
        name: 'email',
        error: 'Correo inválido',
      },
    })
    const input = wrapper.get('input')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.classes()).toContain('border-pink')
    expect(wrapper.text()).toContain('Correo inválido')
  })
})
