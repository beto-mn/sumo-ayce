import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeTypeSelector from './HomeTypeSelector.vue'

const meta = {
  title: 'Homepage/HomeTypeSelector',
  component: HomeTypeSelector,
  tags: ['autodocs'],
} satisfies Meta<typeof HomeTypeSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
