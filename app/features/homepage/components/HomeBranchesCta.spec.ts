import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeBranchesCta from './HomeBranchesCta.vue'

const openReservation = vi.fn()
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useLocalePath', () => (p: string) => p)
vi.mock('@/composables/useReservationModal', () => ({
  useReservationModal: () => ({
    isOpen: { value: false },
    openReservation,
    closeReservation: () => {},
  }),
}))

const stubs = {
  UiButton: { template: '<button class="btn-stub"><slot /></button>' },
  UiKicker: { template: '<span><slot /></span>' },
  NuxtLink: RouterLinkStub,
}

function mountCta() {
  return mount(HomeBranchesCta, { global: { stubs } })
}

describe('HomeBranchesCta', () => {
  it('links the branches control to /branches', () => {
    const links = mountCta().findAllComponents(RouterLinkStub)
    expect(links.map(l => l.props('to'))).toContain('/branches')
  })

  it('calls openReservation when the reserve control is activated', async () => {
    openReservation.mockClear()
    const wrapper = mountCta()
    // The reserve button is the one not wrapped in a NuxtLink (the last btn).
    const buttons = wrapper.findAll('.btn-stub')
    const reserveBtn = buttons.at(-1)
    if (!reserveBtn) throw new Error('reserve button not found')
    await reserveBtn.trigger('click')
    expect(openReservation).toHaveBeenCalledTimes(1)
  })

  it('does not throw when reserve is activated (no-op-safe)', async () => {
    const wrapper = mountCta()
    const reserveBtn = wrapper.findAll('.btn-stub').at(-1)
    if (!reserveBtn) throw new Error('reserve button not found')
    await expect(reserveBtn.trigger('click')).resolves.toBeUndefined()
  })
})
