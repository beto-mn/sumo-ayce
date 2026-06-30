import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ReservationFieldsContactComponent from './ReservationFieldsContact.vue'

const PARTY_SIZE_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const meta = {
  title: 'Reservation/ReservationFieldsContact',
  component: ReservationFieldsContactComponent,
  tags: ['autodocs'],
  argTypes: {
    name: {
      description: "Customer's full name value",
      control: { type: 'text' },
    },
    partySize: {
      description: 'Selected party size number (or null if not selected)',
      control: { type: 'number' },
    },
    phone: {
      description: "Customer's phone number value",
      control: { type: 'text' },
    },
    partySizeOptions: {
      description:
        'Array of { value, label } options for the party size selector',
      control: { type: 'object' },
    },
    errorName: {
      description: 'Validation error message for the name field',
      control: { type: 'text' },
    },
    errorPartySize: {
      description: 'Validation error message for the party size field',
      control: { type: 'text' },
    },
    errorPhone: {
      description: 'Validation error message for the phone field',
      control: { type: 'text' },
    },
    isSubmitting: {
      description: 'Disables all fields while the form is being submitted',
      control: { type: 'boolean' },
    },
    nameDisabled: {
      description:
        'Disables the name field independently (e.g., no branch selected)',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof ReservationFieldsContactComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
}

export const Filled: Story = {
  name: 'Filled fields',
  args: {
    name: 'Juan Pérez',
    partySize: 4,
    phone: '5512345678',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
}

export const WithErrors: Story = {
  name: 'With validation errors',
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: 'reservation.error.name_required',
    errorPartySize: 'reservation.error.party_size',
    errorPhone: 'reservation.error.phone_invalid',
    isSubmitting: false,
    nameDisabled: false,
  },
}

export const Disabled: Story = {
  name: 'Name disabled (no branch selected)',
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: true,
  },
}

export const Submitting: Story = {
  name: 'Submitting (disabled)',
  args: {
    name: 'Juan Pérez',
    partySize: 2,
    phone: '5512345678',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: true,
    nameDisabled: true,
  },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: {
    name: '',
    partySize: null,
    phone: '',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    name: 'Juan Pérez',
    partySize: 4,
    phone: '5512345678',
    partySizeOptions: PARTY_SIZE_OPTIONS,
    errorName: undefined,
    errorPartySize: undefined,
    errorPhone: undefined,
    isSubmitting: false,
    nameDisabled: false,
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
