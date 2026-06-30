import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeBranchesCta from './HomeBranchesCta.vue'

const meta = {
  title: 'Homepage/HomeBranchesCta',
  component: HomeBranchesCta,
  tags: ['autodocs'],
  argTypes: {},
} satisfies Meta<typeof HomeBranchesCta>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
