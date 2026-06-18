import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Select from './Select.vue'

const options = [
  { value: 'a', label: 'Sucursal A' },
  { value: 'b', label: 'Sucursal B' },
]

describe('Select', () => {
  it('renders one option element per provided entry', () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'a', name: 'branch', options },
    })
    const renderedOptions = wrapper.findAll('option')
    expect(renderedOptions).toHaveLength(2)
    expect(renderedOptions[0]?.text()).toBe('Sucursal A')
    expect(renderedOptions[1]?.text()).toBe('Sucursal B')
  })

  it('reflects the modelValue as the selected option', () => {
    const wrapper = mount(Select, {
      props: { modelValue: 'b', name: 'branch', options },
    })
    expect((wrapper.get('select').element as HTMLSelectElement).value).toBe('b')
  })

  it('exposes a label associated with the select for accessibility', () => {
    const wrapper = mount(Select, {
      props: {
        modelValue: 'a',
        name: 'branch',
        options,
        label: 'Sucursal',
      },
    })
    const label = wrapper.get('label')
    const select = wrapper.get('select')
    expect(label.text()).toContain('Sucursal')
    expect(label.attributes('for')).toBe(select.attributes('id'))
  })
})
