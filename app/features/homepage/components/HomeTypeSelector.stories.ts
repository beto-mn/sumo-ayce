import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeTypeSelector from './HomeTypeSelector.vue'

const meta = {
  title: 'Homepage/HomeTypeSelector',
  component: HomeTypeSelector,
  tags: ['autodocs'],
  argTypes: {},
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

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  parameters: { globals: { locale: 'en' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
