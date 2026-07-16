import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import MenuDishCardSkeleton from './MenuDishCardSkeleton.vue'

// UiSkeleton is auto-imported by Nuxt at runtime; stub it here with markup
// mirroring the real component so class-based assertions still hold.
const stubs = {
  UiSkeleton: {
    props: ['shape'],
    template:
      '<div aria-hidden="true" class="animate-pulse motion-reduce:animate-none" :class="shape === \'rect\' ? \'rounded-pop-sm\' : \'rounded-pop-full\'"></div>',
  },
}

function mountCardSkeleton() {
  return mount(MenuDishCardSkeleton, { global: { stubs } })
}

describe('MenuDishCardSkeleton', () => {
  it('renders the same outer card shell classes as MenuDishCard', () => {
    const wrapper = mountCardSkeleton()
    const shell = wrapper.get('div')
    for (const cls of [
      'rounded-pop',
      'border-pop',
      'border-ink',
      'bg-panel',
      'p-4',
      'shadow-pop-sm',
    ]) {
      expect(shell.classes()).toContain(cls)
    }
  })

  it('contains exactly 3 UiSkeleton placeholders (image, title, description)', () => {
    const wrapper = mountCardSkeleton()
    // Every UiSkeleton stub renders a single aria-hidden div; the outer shell
    // is not aria-hidden, so counting aria-hidden divs isolates the skeletons.
    const skeletons = wrapper.findAll('[aria-hidden="true"]')
    expect(skeletons).toHaveLength(3)
  })

  it('every nested skeleton respects reduced motion', () => {
    const wrapper = mountCardSkeleton()
    const skeletons = wrapper.findAll('[aria-hidden="true"]')
    for (const skeleton of skeletons) {
      expect(skeleton.classes()).toContain('animate-pulse')
      expect(skeleton.classes()).toContain('motion-reduce:animate-none')
    }
  })
})
