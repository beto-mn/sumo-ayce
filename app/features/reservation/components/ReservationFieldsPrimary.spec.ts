import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReservationFieldsPrimary from './ReservationFieldsPrimary.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

const TIPO_OPTIONS = [
  { value: 'ayce', label: 'All You Can Eat' },
  { value: 'express', label: 'Express' },
]

const BRANCH_OPTIONS = [
  { value: 'branch-1', label: 'SUMO Polanco' },
  { value: 'branch-2', label: 'SUMO Satélite' },
]

const defaultProps = {
  tipo: 'ayce' as const,
  branchId: null,
  branchOptions: BRANCH_OPTIONS,
  tipoOptions: TIPO_OPTIONS,
  errorBranch: undefined,
  isSubmitting: false,
}

describe('ReservationFieldsPrimary', () => {
  it('renders tipo select with correct value', () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    const select = wrapper.find('[data-testid="tipo-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('ayce')
  })

  it('renders branch select with placeholder option when branchId is null', () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    const select = wrapper.find('[data-testid="branch-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('')
  })

  it('renders branch options from branchOptions prop', () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    const select = wrapper.find('[data-testid="branch-select"]')
    const opts = Array.from(
      (select.element as HTMLSelectElement).options
    ).filter(o => o.value !== '')
    expect(opts).toHaveLength(2)
    expect(opts[0]?.text).toBe('SUMO Polanco')
  })

  it('emits update:tipo when tipo select changes', async () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    await wrapper.find('[data-testid="tipo-select"]').setValue('express')
    expect(wrapper.emitted('update:tipo')).toBeTruthy()
    expect(wrapper.emitted('update:tipo')?.[0]).toEqual(['express'])
  })

  it('emits update:branchId when branch select changes', async () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    await wrapper.find('[data-testid="branch-select"]').setValue('branch-1')
    expect(wrapper.emitted('update:branchId')).toBeTruthy()
    expect(wrapper.emitted('update:branchId')?.[0]).toEqual(['branch-1'])
  })

  it('emits field-edit when tipo select changes', async () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    await wrapper.find('[data-testid="tipo-select"]').setValue('express')
    expect(wrapper.emitted('field-edit')).toBeTruthy()
  })

  it('shows branch error message when errorBranch is set', () => {
    const wrapper = mount(ReservationFieldsPrimary, {
      props: {
        ...defaultProps,
        errorBranch: 'reservation.error.branch_required',
      },
    })
    expect(wrapper.find('[data-testid="error-branch"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="error-branch"]').text()).toBe(
      'reservation.error.branch_required'
    )
  })

  it('does not show branch error when errorBranch is undefined', () => {
    const wrapper = mount(ReservationFieldsPrimary, { props: defaultProps })
    expect(wrapper.find('[data-testid="error-branch"]').exists()).toBe(false)
  })

  it('disables selects when isSubmitting is true', () => {
    const wrapper = mount(ReservationFieldsPrimary, {
      props: { ...defaultProps, isSubmitting: true },
    })
    expect(
      (wrapper.find('[data-testid="tipo-select"]').element as HTMLSelectElement)
        .disabled
    ).toBe(true)
    expect(
      (
        wrapper.find('[data-testid="branch-select"]')
          .element as HTMLSelectElement
      ).disabled
    ).toBe(true)
  })
})
