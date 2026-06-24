import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReservationFieldsDateTime from './ReservationFieldsDateTime.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

const defaultProps = {
  branchId: null as string | null,
  date: '',
  time: '',
  todayIso: '2026-06-23',
  maxDateIso: '2026-07-23',
  horaMin: '13:00',
  horaMax: '21:30',
  scheduleForDate: null,
  errorDate: undefined,
  errorTime: undefined,
  isSubmitting: false,
  dateDisabled: false,
  timeDisabled: true,
}

describe('ReservationFieldsDateTime', () => {
  it('renders date input with min/max from props', () => {
    const wrapper = mount(ReservationFieldsDateTime, { props: defaultProps })
    const input = wrapper.find('[data-testid="date-input"]')
    expect(input.attributes('min')).toBe('2026-06-23')
    expect(input.attributes('max')).toBe('2026-07-23')
  })

  it('renders time input with min/max from props', () => {
    const wrapper = mount(ReservationFieldsDateTime, { props: defaultProps })
    const input = wrapper.find('[data-testid="time-input"]')
    expect(input.attributes('min')).toBe('13:00')
    expect(input.attributes('max')).toBe('21:30')
  })

  it('time input is disabled when timeDisabled is true', () => {
    const wrapper = mount(ReservationFieldsDateTime, { props: defaultProps })
    expect(
      (wrapper.find('[data-testid="time-input"]').element as HTMLInputElement)
        .disabled
    ).toBe(true)
  })

  it('emits update:date when date input changes', async () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, dateDisabled: false },
    })
    await wrapper.find('[data-testid="date-input"]').setValue('2026-07-01')
    expect(wrapper.emitted('update:date')).toBeTruthy()
    expect(wrapper.emitted('update:date')?.[0]).toEqual(['2026-07-01'])
  })

  it('emits update:time when time input changes', async () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, timeDisabled: false },
    })
    await wrapper.find('[data-testid="time-input"]').setValue('14:00')
    expect(wrapper.emitted('update:time')).toBeTruthy()
    expect(wrapper.emitted('update:time')?.[0]).toEqual(['14:00'])
  })

  it('emits field-edit when date input changes', async () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, dateDisabled: false },
    })
    await wrapper.find('[data-testid="date-input"]').setValue('2026-07-01')
    expect(wrapper.emitted('field-edit')).toBeTruthy()
  })

  it('shows schedule hint when scheduleForDate is set and no time error', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: {
        ...defaultProps,
        scheduleForDate: { open: '13:00', close: '22:00' },
      },
    })
    expect(wrapper.find('[data-testid="schedule-hint"]').exists()).toBe(true)
  })

  it('hides schedule hint when errorTime is set', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: {
        ...defaultProps,
        scheduleForDate: { open: '13:00', close: '22:00' },
        errorTime: 'reservation.error.time_required',
      },
    })
    expect(wrapper.find('[data-testid="schedule-hint"]').exists()).toBe(false)
  })

  it('shows date error message when errorDate is set', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, errorDate: 'reservation.error.date_required' },
    })
    expect(wrapper.find('[data-testid="error-date"]').exists()).toBe(true)
  })

  it('shows time error message when errorTime is set', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, errorTime: 'reservation.error.time_required' },
    })
    expect(wrapper.find('[data-testid="error-time"]').exists()).toBe(true)
  })

  it('shows hint-no-branch when branchId is null and no errorTime', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: { ...defaultProps, branchId: null, errorTime: undefined },
    })
    expect(wrapper.find('[data-testid="hint-no-branch"]').exists()).toBe(true)
  })

  it('shows hint-no-schedule when branchId is set, date is set, scheduleForDate is null, and no errorTime', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: {
        ...defaultProps,
        branchId: 'branch-uuid-1',
        date: '2026-07-01',
        scheduleForDate: null,
        errorTime: undefined,
      },
    })
    expect(wrapper.find('[data-testid="hint-no-schedule"]').exists()).toBe(true)
  })

  it('shows neither hint when scheduleForDate is truthy', () => {
    const wrapper = mount(ReservationFieldsDateTime, {
      props: {
        ...defaultProps,
        branchId: 'branch-uuid-1',
        date: '2026-07-01',
        scheduleForDate: { open: '13:00', close: '22:00' },
        errorTime: undefined,
      },
    })
    expect(wrapper.find('[data-testid="hint-no-branch"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="hint-no-schedule"]').exists()).toBe(
      false
    )
  })
})
