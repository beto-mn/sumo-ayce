import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Textarea from './Textarea.vue'

describe('Textarea', () => {
  it('renders a textarea with the default rows and placeholder', () => {
    const wrapper = mount(Textarea, {
      props: { modelValue: '', name: 'notes', placeholder: 'Comentarios' },
    })
    const textarea = wrapper.get('textarea')
    expect(textarea.attributes('rows')).toBe('4')
    expect(textarea.attributes('placeholder')).toBe('Comentarios')
  })

  it('honors a custom rows prop', () => {
    const wrapper = mount(Textarea, {
      props: { modelValue: '', name: 'notes', rows: 7 },
    })
    expect(wrapper.get('textarea').attributes('rows')).toBe('7')
  })

  it('emits update:modelValue when the user types', async () => {
    const wrapper = mount(Textarea, {
      props: { modelValue: '', name: 'notes' },
    })
    await wrapper.get('textarea').setValue('hola mundo')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['hola mundo'])
  })
})
