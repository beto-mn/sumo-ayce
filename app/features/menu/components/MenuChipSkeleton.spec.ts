import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MenuChipSkeleton from './MenuChipSkeleton.vue'

// UiSkeleton is auto-imported by Nuxt at runtime; stub it here with markup
// mirroring the real component so class-based assertions still hold.
const stubs = {
  UiSkeleton: {
    props: ['shape'],
    template:
      '<div aria-hidden="true" class="animate-pulse motion-reduce:animate-none" :class="shape === \'rect\' ? \'rounded-pop-sm\' : \'rounded-pop-full\'"><slot /></div>',
  },
}

function mountChipSkeleton() {
  return mount(MenuChipSkeleton, { global: { stubs } })
}

describe('MenuChipSkeleton', () => {
  it('renders a single pill-shaped placeholder matching UiChip dimensions', () => {
    const wrapper = mountChipSkeleton()
    const div = wrapper.get('div')
    expect(div.classes()).toContain('rounded-pop-full')
    expect(div.classes()).toContain('border-pop-sm')
    expect(div.classes()).toContain('border-ink')
  })

  it('contains a UiSkeleton with shape="pill"', () => {
    const wrapper = mountChipSkeleton()
    expect(wrapper.get('div').classes()).toContain('rounded-pop-full')
  })

  it('respects reduced motion via the nested UiSkeleton', () => {
    const wrapper = mountChipSkeleton()
    const classes = wrapper.get('div').classes()
    expect(classes).toContain('animate-pulse')
    expect(classes).toContain('motion-reduce:animate-none')
  })
})
