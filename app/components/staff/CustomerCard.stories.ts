import type { Meta, StoryObj } from '@storybook/vue3-vite'
import CustomerCard from './CustomerCard.vue'

const meta: Meta<typeof CustomerCard> = {
  title: 'Staff/CustomerCard',
  component: CustomerCard,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' } },
  args: {
    name: 'María García',
    phone: '+52 55 1234 5678',
    pointsBalance: 45,
  },
}

export default meta
type Story = StoryObj<typeof CustomerCard>

export const Default: Story = {}

export const HighBalance: Story = {
  args: { pointsBalance: 200 },
}

export const ZeroPoints: Story = {
  args: { pointsBalance: 0 },
}

export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
