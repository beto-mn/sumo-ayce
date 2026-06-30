import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ReservationFieldsPrimaryComponent from './ReservationFieldsPrimary.vue'

const TIPO_OPTIONS = [
  { value: 'ayce', label: 'All You Can Eat' },
  { value: 'express', label: 'Express' },
]

const BRANCH_OPTIONS = [
  { value: 'branch-1', label: 'SUMO Polanco' },
  { value: 'branch-2', label: 'SUMO Satélite' },
]

const meta = {
  title: 'Reservation/ReservationFieldsPrimary',
  component: ReservationFieldsPrimaryComponent,
  tags: ['autodocs'],
  argTypes: {
    tipo: {
      description: 'Currently selected restaurant type: ayce or express',
      control: { type: 'select' },
      options: ['ayce', 'express'],
    },
    branchId: {
      description: 'Currently selected branch ID (or null if none selected)',
      control: { type: 'text' },
    },
    branchOptions: {
      description:
        'Array of { value, label } branch options for the branch selector',
      control: { type: 'object' },
    },
    tipoOptions: {
      description: 'Array of { value, label } type options (AYCE / Express)',
      control: { type: 'object' },
    },
    errorBranch: {
      description: 'Validation error i18n key for the branch selection field',
      control: { type: 'text' },
    },
    isSubmitting: {
      description: 'Disables all fields while the form is being submitted',
      control: { type: 'boolean' },
    },
  },
} satisfies Meta<typeof ReservationFieldsPrimaryComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    tipo: 'ayce',
    branchId: null,
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
}

export const BranchSelected: Story = {
  name: 'Branch selected',
  args: {
    tipo: 'ayce',
    branchId: 'branch-1',
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
}

export const ExpressMode: Story = {
  name: 'Express mode',
  args: {
    tipo: 'express',
    branchId: null,
    branchOptions: [],
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
}

export const WithBranchError: Story = {
  name: 'With branch error',
  args: {
    tipo: 'ayce',
    branchId: null,
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: 'reservation.error.branch_required',
    isSubmitting: false,
  },
}

export const Submitting: Story = {
  name: 'Submitting (disabled)',
  args: {
    tipo: 'ayce',
    branchId: 'branch-1',
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: true,
  },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: {
    tipo: 'ayce',
    branchId: null,
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: {
    tipo: 'ayce',
    branchId: null,
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: {
    tipo: 'ayce',
    branchId: null,
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    tipo: 'ayce',
    branchId: 'branch-1',
    branchOptions: BRANCH_OPTIONS,
    tipoOptions: TIPO_OPTIONS,
    errorBranch: undefined,
    isSubmitting: false,
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
