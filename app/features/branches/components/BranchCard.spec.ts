import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SortedBranch } from '../types'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

import BranchCard from './BranchCard.vue'

const AYCE_BRANCH: SortedBranch = {
  id: 'p1',
  name: 'SUMO Polanco',
  address: 'Av. Presidente Masaryk 123, Polanco',
  lat: '19.43260000',
  lng: '-99.19240000',
  isActive: true,
  type: 'ayce',
  schedule: {
    weekdays: { open: '12:00', close: '22:00' },
    weekends: { open: '11:00', close: '23:00' },
  },
  phone: '+52551234567',
}

const EXPRESS_BRANCH: SortedBranch = {
  id: 'b1',
  name: 'SUMO Buenavista',
  address: 'Eje 1 Norte s/n, Buenavista',
  lat: '19.44980000',
  lng: '-99.15030000',
  isActive: true,
  type: 'express',
  schedule: null,
  phone: null,
}

const BRANCH_WITH_DISTANCE: SortedBranch = {
  ...AYCE_BRANCH,
  distanceKm: 1.23,
}

describe('BranchCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the branch name', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    expect(wrapper.text()).toContain('SUMO Polanco')
  })

  it('renders AYCE type chip with orange accent class', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const chip = wrapper.find('[data-testid="type-chip"]')
    expect(chip.exists()).toBe(true)
    expect(chip.classes()).not.toContain('scope-express')
  })

  it('renders Express type chip with express accent class', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: EXPRESS_BRANCH },
    })
    const chip = wrapper.find('[data-testid="type-chip"]')
    expect(chip.exists()).toBe(true)
    expect(chip.classes()).toContain('scope-express')
  })

  it('shows distanceKm element when provided', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: BRANCH_WITH_DISTANCE },
    })
    const distEl = wrapper.find('[data-testid="distance"]')
    expect(distEl.exists()).toBe(true)
  })

  it('hides distance when distanceKm is not defined', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const distEl = wrapper.find('[data-testid="distance"]')
    expect(distEl.exists()).toBe(false)
  })

  it('hides Call button when phone is null', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: EXPRESS_BRANCH },
    })
    const callBtn = wrapper.find('[data-testid="call-button"]')
    expect(callBtn.exists()).toBe(false)
  })

  it('shows Call button when phone is provided', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const callBtn = wrapper.find('[data-testid="call-button"]')
    expect(callBtn.exists()).toBe(true)
  })

  it('emits reserve when Reserve button is clicked', async () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    await wrapper.find('[data-testid="reserve-button"]').trigger('click')
    expect(wrapper.emitted('reserve')).toBeTruthy()
  })

  it('directions button links to Google Maps with branch coordinates', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const href = wrapper
      .find('[data-testid="directions-button"]')
      .attributes('href')
    expect(href).toContain('google.com/maps')
    expect(href).toContain(String(AYCE_BRANCH.lat))
    expect(href).toContain(String(AYCE_BRANCH.lng))
  })

  it('emits call when Call button is clicked', async () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    await wrapper.find('[data-testid="call-button"]').trigger('click')
    expect(wrapper.emitted('call')).toBeTruthy()
    expect(wrapper.emitted('call')?.[0]?.[0]).toBe('+52551234567')
  })

  it('applies highlight ring class when highlighted prop is true', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH, highlighted: true },
    })
    const root = wrapper.find('[data-testid="branch-card"]')
    expect(root.classes()).toContain('ring-4')
  })

  it('does not apply highlight ring class by default', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const root = wrapper.find('[data-testid="branch-card"]')
    expect(root.classes()).not.toContain('ring-4')
  })

  it('renders the branch address', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    expect(wrapper.text()).toContain('Av. Presidente Masaryk 123, Polanco')
  })

  it('has an accessible aria-label including the branch name', () => {
    const wrapper = mount(BranchCard, {
      props: { branch: AYCE_BRANCH },
    })
    const root = wrapper.find('[data-testid="branch-card"]')
    expect(root.attributes('aria-label')).toContain('SUMO Polanco')
  })

  it('shows schedule when provided', () => {
    const branchWithSchedule: SortedBranch = {
      ...AYCE_BRANCH,
      schedule: {
        weekdays: { open: '12:00', close: '22:00' },
      },
    }
    const wrapper = mount(BranchCard, {
      props: { branch: branchWithSchedule },
    })
    expect(wrapper.text()).toContain('12:00')
    expect(wrapper.text()).toContain('22:00')
  })

  it('shows hoursUnavailable when schedule is null', () => {
    const branchNoSchedule: SortedBranch = {
      ...AYCE_BRANCH,
      schedule: null,
    }
    const wrapper = mount(BranchCard, {
      props: { branch: branchNoSchedule },
    })
    expect(wrapper.text()).toContain('branches.card.hoursUnavailable')
  })
})
