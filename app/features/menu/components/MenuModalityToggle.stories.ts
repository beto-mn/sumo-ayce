import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuModalityToggle from './MenuModalityToggle.vue'

const meta = {
  title: 'Menu/MenuModalityToggle',
  component: MenuModalityToggle,
  tags: ['autodocs'],
  argTypes: {
    activeModality: {
      description:
        'Currently active menu modality: buffet (all-inclusive) or carta (a la carte)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
} satisfies Meta<typeof MenuModalityToggle>

export default meta
type Story = StoryObj<typeof meta>

export const Buffet: Story = {
  args: { activeModality: 'buffet' },
}

export const Carta: Story = {
  args: { activeModality: 'carta' },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { activeModality: 'buffet' },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { activeModality: 'buffet' },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: { activeModality: 'buffet' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
