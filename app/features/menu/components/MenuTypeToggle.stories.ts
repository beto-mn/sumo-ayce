import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuTypeToggle from './MenuTypeToggle.vue'

const meta = {
  title: 'Menu/MenuTypeToggle',
  component: MenuTypeToggle,
  tags: ['autodocs'],
} satisfies Meta<typeof MenuTypeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const AYCE: Story = {
  args: { activeType: 'ayce' },
}

export const Express: Story = {
  args: { activeType: 'express' },
}

export const Mobile: Story = {
  args: { activeType: 'ayce' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
