import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { getCuratedSet } from '@/features/menu/menu-sets'
import MenuSkeleton from './MenuSkeleton.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'es' },
}))

// MenuChipSkeleton/MenuDishCardSkeleton are auto-imported by Nuxt at runtime;
// stub them here with markup mirroring their real reduced-motion contract so
// composition-level assertions (count + motion-reduce) still hold, isolated
// from their own implementation details (covered by their own specs).
const stubs = {
  MenuChipSkeleton: {
    template:
      '<div class="chip-skeleton-stub animate-pulse motion-reduce:animate-none" aria-hidden="true" />',
  },
  MenuDishCardSkeleton: {
    template:
      '<div class="dish-card-skeleton-stub"><div v-for="n in 3" :key="n" aria-hidden="true" class="animate-pulse motion-reduce:animate-none" /></div>',
  },
}

function mountSkeleton(
  selection: 'ayce' | 'express' | 'drinks' | 'kids',
  modality: 'buffet' | 'carta' = 'buffet'
) {
  return mount(MenuSkeleton, {
    props: { selection, modality },
    global: { stubs },
  })
}

describe('MenuSkeleton', () => {
  it.each([
    { selection: 'ayce', modality: 'buffet', expectedCount: 8 },
    { selection: 'ayce', modality: 'carta', expectedCount: 11 },
    { selection: 'express', modality: 'buffet', expectedCount: 8 },
    { selection: 'drinks', modality: 'buffet', expectedCount: 6 },
  ] as const)('renders exactly $expectedCount chip skeletons for ($selection, $modality)', ({
    selection,
    modality,
    expectedCount,
  }) => {
    const wrapper = mountSkeleton(selection, modality)
    expect(wrapper.findAll('.chip-skeleton-stub')).toHaveLength(expectedCount)
    // Sanity: matches the same source of truth the real chip row uses.
    expect(getCuratedSet(selection, modality)).toHaveLength(expectedCount)
  })

  it('renders no chip row at all for kids', () => {
    const wrapper = mountSkeleton('kids')
    expect(wrapper.findAll('.chip-skeleton-stub')).toHaveLength(0)
  })

  it.each([
    'ayce',
    'express',
    'drinks',
    'kids',
  ] as const)('always renders exactly 6 dish-card skeletons regardless of selection (%s)', selection => {
    const wrapper = mountSkeleton(selection)
    expect(wrapper.findAll('.dish-card-skeleton-stub')).toHaveLength(6)
  })

  it('carries role="status" and aria-live="polite" with a visually-hidden label', () => {
    const wrapper = mountSkeleton('ayce')
    const root = wrapper.get('[role="status"]')
    expect(root.attributes('aria-live')).toBe('polite')
    expect(wrapper.find('.sr-only').exists()).toBe(true)
  })

  it('no rendered skeleton element is missing motion-reduce:animate-none (chip-bearing view)', () => {
    const wrapper = mountSkeleton('ayce', 'buffet')
    const skeletons = wrapper.findAll('[aria-hidden="true"]')
    expect(skeletons.length).toBeGreaterThan(0)
    for (const el of skeletons) {
      expect(el.classes()).toContain('animate-pulse')
      expect(el.classes()).toContain('motion-reduce:animate-none')
    }
  })

  it('no rendered skeleton element is missing motion-reduce:animate-none (kids view)', () => {
    const wrapper = mountSkeleton('kids')
    const skeletons = wrapper.findAll('[aria-hidden="true"]')
    expect(skeletons.length).toBeGreaterThan(0)
    for (const el of skeletons) {
      expect(el.classes()).toContain('animate-pulse')
      expect(el.classes()).toContain('motion-reduce:animate-none')
    }
  })
})
