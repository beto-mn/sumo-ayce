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
  category: 'frio',
}

const meta = {
  title: 'Homepage/DishCard',
  component: DishCard,
  tags: ['autodocs'],
  argTypes: {
    dish: {
      description:
        'FeaturedDish object with id, name, description (ES/EN), imageUrl, badge, and category',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof DishCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { dish: base },
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
