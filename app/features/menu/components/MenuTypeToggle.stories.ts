import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuTypeToggle from './MenuTypeToggle.vue'

const meta = {
  title: 'Menu/MenuTypeToggle',
  component: MenuTypeToggle,
  tags: ['autodocs'],
  argTypes: {
    activeType: {
      description: 'Currently active restaurant type: ayce or express',
      control: { type: 'select' },
      options: ['ayce', 'express'],
    },
  },
} satisfies Meta<typeof MenuTypeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const AYCE: Story = {
  args: { activeType: 'ayce' },
}

export const Express: Story = {
  args: { activeType: 'express' },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { activeType: 'ayce' },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { activeType: 'ayce' },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: { activeType: 'ayce' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
