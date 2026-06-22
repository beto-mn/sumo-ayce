import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { SortedBranch } from '../types'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))

const mockOpenReservation = vi.fn()
vi.mock('@/composables/useReservationModal', () => ({
  useReservationModal: () => ({ openReservation: mockOpenReservation }),
}))

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
    // First card (b1) should have ring-4 class
    expect(cards[0]?.classes()).toContain('ring-4')
    // Second card (b2) should not
    expect(cards[1]?.classes()).not.toContain('ring-4')
  })

  it('emits branch-select with branch id when a card emits reserve', async () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1] },
    })
    await wrapper.find('[data-testid="reserve-button"]').trigger('click')
    expect(wrapper.emitted('branch-select')).toBeTruthy()
    expect(wrapper.emitted('branch-select')?.[0]).toEqual(['b1'])
  })

  it('calls openReservation when Reserve button is clicked (US5-AC1)', async () => {
    const wrapper = mount(BranchList, {
      ...globalConfig,
      props: { branches: [BRANCH_1] },
    })
    await wrapper.find('[data-testid="reserve-button"]').trigger('click')
    expect(mockOpenReservation).toHaveBeenCalledOnce()
  })
})
