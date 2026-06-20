import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeTypeSelector from './HomeTypeSelector.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  // Resolve the chip arrays so `chips()` has data to iterate.
  tm: (key: string) =>
    key.endsWith('.chips') ? ['All You Can Eat', 'A la carta'] : [],
  rt: (entry: string) => entry,
}))
vi.stubGlobal('useLocalePath', () => (path: string) => path)

const stubs = {
  UiCard: {
    props: ['accent'],
    template: '<div class="card-stub" :data-accent="accent"><slot /></div>',
  },
  UiKicker: { template: '<span><slot /></span>' },
  UiSticker: { template: '<span class="badge-stub"><slot /></span>' },
  UiChip: { template: '<span class="chip-stub"><slot /></span>' },
  UiButton: { template: '<button><slot /></button>' },
  NuxtLink: RouterLinkStub,
}

function mountSelector() {
  return mount(HomeTypeSelector, { global: { stubs } })
}

describe('HomeTypeSelector', () => {
  it('renders exactly two type cards', () => {
    expect(mountSelector().findAll('.card-stub')).toHaveLength(2)
  })

  it('shows the section heading (not just the kicker)', () => {
    expect(mountSelector().find('h2').exists()).toBe(true)
  })

  it('links the AYCE card to /menu?type=ayce', () => {
    const links = mountSelector().findAllComponents(RouterLinkStub)
    const targets = links.map(l => l.props('to'))
    expect(targets).toContain('/menu?type=ayce')
  })

  it('links the Express card to /menu?type=express', () => {
    const links = mountSelector().findAllComponents(RouterLinkStub)
    const targets = links.map(l => l.props('to'))
    expect(targets).toContain('/menu?type=express')
  })

  it('uses the orange accent for AYCE and blue (express) for Express', () => {
    const cards = mountSelector().findAll('.card-stub')
    const accents = cards.map(c => c.attributes('data-accent'))
    expect(accents).toContain('ayce')
    expect(accents).toContain('express')
  })

  it('renders a badge and at least one chip per card', () => {
    const wrapper = mountSelector()
    expect(wrapper.findAll('.badge-stub').length).toBe(2)
    expect(wrapper.findAll('.chip-stub').length).toBeGreaterThanOrEqual(2)
  })
})
