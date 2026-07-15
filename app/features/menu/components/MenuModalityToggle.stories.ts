import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuModalityToggle from './MenuModalityToggle.vue'

const meta = {
  title: 'Menu/MenuModalityToggle',
  component: MenuModalityToggle,
  tags: ['autodocs'],
  argTypes: {
    activeModality: {
      description:
        'Active AYCE modality: buffet ("All You Can Eat") or carta ("Carta" ES / "Menu" EN). Only rendered for the AYCE selection.',
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

/**
 * Mobile (360px): the single segmented rounded-pill FILLS the row (segments
 * share the width via flex-1); the font is unchanged and the labels stay on one
 * line (whitespace-nowrap) with no cut-off and no horizontal scroll. At sm
 * (520px+) it sits at natural inline width and wraps as a whole pill.
 */
export const Mobile: Story = {
  args: { activeModality: 'buffet' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
