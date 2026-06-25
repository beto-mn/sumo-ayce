import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuModalityToggle from './MenuModalityToggle.vue'

const meta = {
  title: 'Menu/MenuModalityToggle',
  component: MenuModalityToggle,
  tags: ['autodocs'],
} satisfies Meta<typeof MenuModalityToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Buffet: Story = {
  args: { activeModality: 'buffet' },
}

export const Carta: Story = {
  args: { activeModality: 'carta' },
}

export const Mobile: Story = {
  args: { activeModality: 'buffet' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
