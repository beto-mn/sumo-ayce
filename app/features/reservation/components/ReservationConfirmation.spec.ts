import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import type { ReservationConfirmation as ReservationConfirmationType } from '../types'
import ReservationConfirmation from './ReservationConfirmation.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

const SAMPLE: ReservationConfirmationType = {
  folio: 'SUMO-1234',
  branchName: 'SUMO Polanco',
  date: '2026-07-15',
  time: '14:00',
  partySize: 4,
}

describe('ReservationConfirmation', () => {
  it('renders the folio number', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="folio"]').text()).toBe('SUMO-1234')
  })

  it('renders the branch name', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="branch-name"]').text()).toBe(
      'SUMO Polanco'
    )
  })

  it('renders the date', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="conf-date"]').text()).toBe('2026-07-15')
  })

  it('renders the time', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="conf-time"]').text()).toBe('14:00')
  })

  it('renders the party size', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="conf-party-size"]').text()).toBe('4')
  })

  it('renders the WhatsApp note', () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    expect(wrapper.find('[data-testid="whatsapp-note"]').exists()).toBe(true)
  })

  it('emits reset event when reset button is clicked', async () => {
    const wrapper = mount(ReservationConfirmation, {
      props: { confirmation: SAMPLE },
    })
    await wrapper.find('[data-testid="reset-button"]').trigger('click')
    expect(wrapper.emitted('reset')).toBeTruthy()
  })
})
