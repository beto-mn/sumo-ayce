import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ReservationFieldsDateTimeComponent from './ReservationFieldsDateTime.vue'

const meta = {
  title: 'Reservation/ReservationFieldsDateTime',
  component: ReservationFieldsDateTimeComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof ReservationFieldsDateTimeComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    branchId: null,
    date: '',
    time: '',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '',
    horaMax: '',
    scheduleForDate: null,
    errorDate: undefined,
    errorTime: undefined,
    isSubmitting: false,
    dateDisabled: false,
    timeDisabled: true,
  },
}

export const DateAndTimeEnabled: Story = {
  name: 'Date and time enabled with schedule',
  args: {
    branchId: 'branch-uuid-1',
    date: '2026-07-01',
    time: '14:00',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '13:00',
    horaMax: '21:30',
    scheduleForDate: { open: '13:00', close: '22:00' },
    errorDate: undefined,
    errorTime: undefined,
    isSubmitting: false,
    dateDisabled: false,
    timeDisabled: false,
  },
}

export const WithErrors: Story = {
  name: 'With validation errors',
  args: {
    branchId: null,
    date: '',
    time: '',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '',
    horaMax: '',
    scheduleForDate: null,
    errorDate: 'reservation.error.date_required',
    errorTime: 'reservation.error.time_required',
    isSubmitting: false,
    dateDisabled: false,
    timeDisabled: false,
  },
}

export const Submitting: Story = {
  name: 'Submitting (disabled)',
  args: {
    branchId: 'branch-uuid-1',
    date: '2026-07-01',
    time: '14:00',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '13:00',
    horaMax: '21:30',
    scheduleForDate: { open: '13:00', close: '22:00' },
    errorDate: undefined,
    errorTime: undefined,
    isSubmitting: true,
    dateDisabled: true,
    timeDisabled: true,
  },
}

export const Mobile: Story = {
  args: {
    branchId: 'branch-uuid-1',
    date: '2026-07-01',
    time: '',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '13:00',
    horaMax: '21:30',
    scheduleForDate: { open: '13:00', close: '22:00' },
    errorDate: undefined,
    errorTime: undefined,
    isSubmitting: false,
    dateDisabled: false,
    timeDisabled: false,
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    branchId: 'branch-uuid-1',
    date: '2026-07-01',
    time: '14:00',
    todayIso: '2026-06-23',
    maxDateIso: '2026-07-23',
    horaMin: '13:00',
    horaMax: '21:30',
    scheduleForDate: { open: '13:00', close: '22:00' },
    errorDate: undefined,
    errorTime: undefined,
    isSubmitting: false,
    dateDisabled: false,
    timeDisabled: false,
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
