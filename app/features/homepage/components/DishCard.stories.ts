import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FeaturedDish } from '@/types/content'
import DishCard from './DishCard.vue'

const base: FeaturedDish = {
  id: 'd1',
  name: 'Salmón Nigiri',
  description: {
    es: 'Salmón fresco sobre arroz avinagrado.',
    en: 'Fresh salmon over vinegared rice.',
  },
  imageUrl: '/hero-placeholder.svg',
  badge: null,
  category: 'cold_rolls',
  locationType: 'ayce',
  includedInAyce: true,
}

const meta = {
  title: 'Homepage/DishCard',
  component: DishCard,
  tags: ['autodocs'],
  argTypes: {
    dish: {
      description:
        'FeaturedDish object with id, name, description (ES/EN), imageUrl, badge, category, locationType (ayce | express | both) and includedInAyce — the last two drive the /menu deep link',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof DishCard>

export default meta
type Story = StoryObj<typeof meta>

/** AYCE dish → links to /menu?type=ayce&modality=buffet&category=<key>. */
export const Default: Story = {
  args: { dish: base },
}

/**
 * Express dish → links to /menu?type=express&category=<key> (no modality).
 * Demonstrates the data-driven deep-link difference vs. the AYCE default.
 */
export const Express: Story = {
  args: {
    dish: {
      ...base,
      id: 'e1',
      name: 'Sumo Burrito',
      description: {
        es: 'Burrito estilo americano-japonés.',
        en: 'American-Japanese style burrito.',
      },
      category: 'burritos',
      locationType: 'express',
      includedInAyce: false,
    },
  },
}

export const WithBadge: Story = {
  args: { dish: { ...base, badge: 'Top' } },
}

export const NoImage: Story = {
  args: { dish: { ...base, imageUrl: null } },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { dish: base },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { dish: base },
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  args: { dish: base },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
