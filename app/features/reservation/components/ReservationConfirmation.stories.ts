import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { ReservationConfirmation } from '../types'
import ReservationConfirmationComponent from './ReservationConfirmation.vue'

const SAMPLE_CONFIRMATION: ReservationConfirmation = {
  folio: 'SUMO-1234',
  branchName: 'SUMO Polanco',
  date: '2026-07-15',
  time: '14:00',
  partySize: 4,
}

const meta = {
  title: 'Reservation/ReservationConfirmation',
  component: ReservationConfirmationComponent,
  tags: ['autodocs'],
} satisfies Meta<typeof ReservationConfirmationComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    confirmation: SAMPLE_CONFIRMATION,
  },
}

export const LargeParty: Story = {
  name: 'Large Party',
  args: {
    confirmation: {
      ...SAMPLE_CONFIRMATION,
      folio: 'SUMO-5678',
      partySize: 12,
    },
  },
}

export const ExpressBranch: Story = {
  name: 'Express Branch',
  args: {
    confirmation: {
      ...SAMPLE_CONFIRMATION,
      branchName: 'SUMO Express Buenavista',
      folio: 'SUMO-9999',
    },
  },
}

export const Mobile: Story = {
  args: { confirmation: SAMPLE_CONFIRMATION },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { confirmation: SAMPLE_CONFIRMATION },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
