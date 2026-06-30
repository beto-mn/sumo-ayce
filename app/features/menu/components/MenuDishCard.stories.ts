import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuDish, FullMenuSauce } from '@/types/menu'
import MenuDishCard from './MenuDishCard.vue'

const sauces: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    imageUrl: null,
    spiceLevel: 0,
  },
  {
    id: 's2',
    name: { es: 'Buffalo', en: 'Buffalo' },
    imageUrl: null,
    spiceLevel: 2,
  },
  {
    id: 's3',
    name: { es: 'Habanero', en: 'Habanero' },
    imageUrl: null,
    spiceLevel: 4,
  },
]

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
  drinkGroup: null,
  drinkSubGroup: null,
  requiresSauce: false,
}

const meta = {
  title: 'Menu/MenuDishCard',
  component: MenuDishCard,
  tags: ['autodocs'],
  args: { sauces, modality: 'buffet' },
  argTypes: {
    dish: {
      description:
        'FullMenuDish object with localized name, description, imageUrl, badge, price, and sauce flags',
      control: { type: 'object' },
    },
    sauces: {
      description:
        'Available sauce options shown when the dish requiresSauce is true',
      control: { type: 'object' },
    },
    modality: {
      description:
        'Menu modality: buffet (included dishes) or carta (a la carte with prices)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
} satisfies Meta<typeof MenuDishCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { dish: base },
}

export const NoImage: Story = {
  args: { dish: { ...base, imageUrl: null } },
}

export const WithBadge: Story = {
  args: { dish: { ...base, badge: { es: 'Nuevo', en: 'New' } } },
}

export const WithSauce: Story = {
  args: { dish: { ...base, requiresSauce: true } },
}

export const CartaWithPrice: Story = {
  args: {
    dish: { ...base, price: '128.00', incluido: false },
    modality: 'carta',
  },
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
