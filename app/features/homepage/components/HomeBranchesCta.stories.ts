import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeBranchesCta from './HomeBranchesCta.vue'

const meta = {
  title: 'Homepage/HomeBranchesCta',
  component: HomeBranchesCta,
  tags: ['autodocs'],
} satisfies Meta<typeof HomeBranchesCta>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
