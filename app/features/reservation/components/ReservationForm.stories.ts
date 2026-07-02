import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Branch } from '../types'
import ReservationFormComponent from './ReservationForm.vue'

const AYCE_BRANCH: Branch = {
  id: 'branch-uuid-1',
  name: 'SUMO Polanco',
  type: 'ayce',
  schedule: {
    mon: { open: '13:00', close: '22:00' },
    tue: { open: '13:00', close: '22:00' },
    wed: { open: '13:00', close: '22:00' },
    thu: { open: '13:00', close: '22:00' },
    fri: { open: '13:00', close: '22:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '11:00', close: '23:00' },
  },
}

const EXPRESS_BRANCH: Branch = {
  id: 'branch-uuid-2',
  name: 'SUMO Express Buenavista',
  type: 'express',
  schedule: {
    mon: { open: '12:00', close: '20:00' },
    tue: { open: '12:00', close: '20:00' },
    wed: { open: '12:00', close: '20:00' },
    thu: { open: '12:00', close: '20:00' },
    fri: { open: '12:00', close: '20:00' },
    sat: null,
    sun: null,
  },
}

const BRANCHES: Branch[] = [AYCE_BRANCH, EXPRESS_BRANCH]

const meta = {
  title: 'Reservation/ReservationForm',
  component: ReservationFormComponent,
  tags: ['autodocs'],
  argTypes: {
    branches: {
      description:
        'Array of Branch objects available for selection in the form',
      control: { type: 'object' },
    },
    initialBranchId: {
      description: 'Pre-selected branch ID to initialize the form with',
      control: { type: 'text' },
    },
    initialTipo: {
      description: 'Pre-selected restaurant type to initialize the form with',
      control: { type: 'select' },
      options: ['ayce', 'express'],
    },
  },
} satisfies Meta<typeof ReservationFormComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    branches: BRANCHES,
  },
}

export const AYCEPreFilled: Story = {
  name: 'AYCE — Pre-filled branch',
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-1',
    initialTipo: 'ayce',
  },
}

export const ExpressPreFilled: Story = {
  name: 'Express — Pre-filled branch',
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-2',
    initialTipo: 'express',
  },
}

export const NoBranches: Story = {
  name: 'No branches available',
  args: {
    branches: [],
  },
}

export const Mobile: Story = {
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-1',
    initialTipo: 'ayce',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    branches: BRANCHES,
    initialBranchId: 'branch-uuid-1',
    initialTipo: 'ayce',
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}

// State variants that exercise the submit flow (Loading, WithApiError) live in
// ReservationForm.variants.stories.ts to keep this file under the 200-line
// limit (Constitution Article VIII).
