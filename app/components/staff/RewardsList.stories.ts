import type { Meta, StoryObj } from '@storybook/vue3-vite'
import RewardsList from './RewardsList.vue'

const rewards = [
  {
    id: 'r1',
    name: 'Postre gratis',
    description: 'Un postre a elección',
    pointsCost: 10,
  },
  { id: 'r2', name: 'Refresco gratis', description: null, pointsCost: 5 },
  {
    id: 'r3',
    name: 'Entrada gratis',
    description: 'Aplica en visita de adulto',
    pointsCost: 20,
  },
]

const meta: Meta<typeof RewardsList> = {
  title: 'Staff/RewardsList',
  component: RewardsList,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' } },
  args: { rewards, customerBalance: 12 },
}

export default meta
type Story = StoryObj<typeof RewardsList>

export const Default: Story = {}

export const AllAffordable: Story = {
  args: { customerBalance: 100 },
}

export const NoneAffordable: Story = {
  args: { customerBalance: 0 },
}

export const Empty: Story = {
  args: { rewards: [] },
}

export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
