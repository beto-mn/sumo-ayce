import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import UiSkeleton from './UiSkeleton.vue'

describe('UiSkeleton', () => {
  it('renders a div marked aria-hidden (purely decorative)', () => {
    const wrapper = mount(UiSkeleton)
    const div = wrapper.get('div')
    expect(div.attributes('aria-hidden')).toBe('true')
  })

  it('applies rounded-pop-sm for the default rect shape', () => {
    const wrapper = mount(UiSkeleton)
    expect(wrapper.get('div').classes()).toContain('rounded-pop-sm')
  })

  it('applies rounded-pop-full for the pill shape', () => {
    const wrapper = mount(UiSkeleton, { props: { shape: 'pill' } })
    expect(wrapper.get('div').classes()).toContain('rounded-pop-full')
  })

  it('applies rounded-pop-full for the circle shape', () => {
    const wrapper = mount(UiSkeleton, { props: { shape: 'circle' } })
    expect(wrapper.get('div').classes()).toContain('rounded-pop-full')
  })

  it.each([
    'rect',
    'pill',
    'circle',
  ] as const)('always applies animate-pulse and motion-reduce:animate-none regardless of shape (%s)', shape => {
    const wrapper = mount(UiSkeleton, { props: { shape } })
    const classes = wrapper.get('div').classes()
    expect(classes).toContain('animate-pulse')
    expect(classes).toContain('motion-reduce:animate-none')
  })
})
