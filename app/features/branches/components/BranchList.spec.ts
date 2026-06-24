import { mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SortedBranch } from '../types'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useLocalePath', () => (p: string) => p)

import BranchCard from './BranchCard.vue'
import BranchList from './BranchList.vue'

const BRANCH_1: SortedBranch = {
  id: 'b1',
  name: 'SUMO Polanco',
  address: 'Masaryk 123',
  lat: '19.4326',
  lng: '-99.1924',
  isActive: true,
  type: 'ayce',
  schedule: null,
  phone: '+52551234567',
}

const BRANCH_2: SortedBranch = {
  id: 'b2',
  name: 'SUMO Buenavista',
  address: 'Eje 1 Norte s/n',
  lat: '19.4498',
  lng: '-99.1503',
  isActive: true,
  type: 'express',
  schedule: null,
  phone: null,
}

const globalConfig = {
  global: {
    components: { BranchCard },
    stubs: { NuxtLink: RouterLinkStub },
  },
}

describe('BranchList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders a BranchCard for each branch in the list', () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1, BRANCH_2] },
    })
    const cards = wrapper.findAll('[data-testid="branch-card"]')
    expect(cards).toHaveLength(2)
  })

  it('shows empty state message when branches array is empty', () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [] },
    })
    const empty = wrapper.find('[data-testid="empty-state"]')
    expect(empty.exists()).toBe(true)
  })

  it('does not show empty state when branches are present', () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1] },
    })
    const empty = wrapper.find('[data-testid="empty-state"]')
    expect(empty.exists()).toBe(false)
  })

  it('passes highlighted=true to the matching card', () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1, BRANCH_2], highlightedId: 'b1' },
    })
    const cards = wrapper.findAll('[data-testid="branch-card"]')
    expect(cards[0]?.classes()).toContain('ring-4')
    expect(cards[1]?.classes()).not.toContain('ring-4')
  })

  it('reserve button is a NuxtLink pointing to /reserve with branch id and type', () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1] },
    })
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.props('to')).toContain('/reserve')
    expect(link.props('to')).toContain('b1')
    expect(link.props('to')).toContain('ayce')
  })
})
