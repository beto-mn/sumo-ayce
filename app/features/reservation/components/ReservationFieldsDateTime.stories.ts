import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ReservationFieldsDateTimeComponent from './ReservationFieldsDateTime.vue'

const meta = {
  title: 'Reservation/ReservationFieldsDateTime',
  component: ReservationFieldsDateTimeComponent,
  tags: ['autodocs'],
  argTypes: {
    branchId: {
      description: 'Selected branch ID (enables date input when not null)',
      control: { type: 'text' },
    },
    date: {
      description: 'Selected date value in ISO format (YYYY-MM-DD)',
      control: { type: 'text' },
    },
    time: {
      description: 'Selected time value in HH:MM format',
      control: { type: 'text' },
    },
    todayIso: {
      description: 'Minimum selectable date (today) in ISO format',
      control: { type: 'text' },
    },
    maxDateIso: {
      description: 'Maximum selectable date in ISO format',
      control: { type: 'text' },
    },
    horaMin: {
      description: 'Earliest time slot available in HH:MM format',
      control: { type: 'text' },
    },
    horaMax: {
      description: 'Latest time slot available in HH:MM format',
      control: { type: 'text' },
    },
    scheduleForDate: {
      description:
        'Branch schedule for the selected date with open/close times',
      control: { type: 'object' },
    },
    errorDate: {
      description: 'Validation error i18n key for the date field',
      control: { type: 'text' },
    },
    errorTime: {
      description: 'Validation error i18n key for the time field',
      control: { type: 'text' },
    },
    isSubmitting: {
      description: 'Disables all fields while the form is being submitted',
      control: { type: 'boolean' },
    },
    dateDisabled: {
      description: 'Disables the date input field',
      control: { type: 'boolean' },
    },
    timeDisabled: {
      description: 'Disables the time input field (no date selected)',
      control: { type: 'boolean' },
    },
  },
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
