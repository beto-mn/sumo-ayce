import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuDish } from '@/types/menu'
import MenuDishCard from './MenuDishCard.vue'

const base: FullMenuDish = {
  id: 'd1',
  name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
  description: {
    es: 'Salmón flameado con aguacate y sriracha.',
    en: 'Flamed salmon with avocado and sriracha.',
  },
  imageUrl: 'https://placehold.co/400x300',
  badge: null,
  price: null,
  incluido: true,
  includedInAyce: true,
  drinkGroup: null,
  drinkSubGroup: null,
  requiresSauce: false,
  featured: false,
}

const meta = {
  title: 'Menu/MenuDishCard',
  component: MenuDishCard,
  tags: ['autodocs'],
  args: { dish: base, modality: 'buffet' },
  argTypes: {
    dish: {
      description:
        'FullMenuDish with localized name/description, imageUrl, badge and price. The whole card gently zooms on hover and lifts above its neighbors (hover-capable devices only; no zoom under reduced motion).',
      control: { type: 'object' },
    },
    modality: {
      description: 'Menu modality: buffet ("Incluido") or carta (price shown)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
} satisfies Meta<typeof MenuDishCard>

export default meta
type Story = StoryObj<typeof meta>

/** Default buffet card — hover the card to see the whole-card zoom (desktop pointers). */
export const Default: Story = {}

export const NoImage: Story = {
  args: { dish: { ...base, imageUrl: null } },
}

export const WithBadge: Story = {
  args: { dish: { ...base, badge: { es: 'Nuevo', en: 'New' } } },
}

/**
 * Garantía Sumo (featured): the curated dishes show the star badge overlay at
 * top-left (from `/brand/garantia-sumo.webp`), clear of the top-right badge.
 */
export const FeaturedGarantiaSumo: Story = {
  args: {
    dish: { ...base, featured: true, badge: { es: 'Nuevo', en: 'New' } },
  },
}

/** Alitas & Boneless no longer show a sauce picker (FR-021). */
export const WingsWithoutSaucePicker: Story = {
  args: {
    dish: {
      ...base,
      name: { es: 'Boneless', en: 'Boneless' },
      requiresSauce: true,
    },
  },
}

export const CartaWithPrice: Story = {
  args: {
    dish: { ...base, price: '128.00', incluido: false },
    modality: 'carta',
  },
}

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
