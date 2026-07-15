import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuDrinkCard from './MenuDrinkCard.vue'

const meta = {
  title: 'Menu/MenuDrinkCard',
  component: MenuDrinkCard,
  tags: ['autodocs'],
  args: {
    name: 'Vaso Sumo',
    description: 'Vaso SUMO 960 ml, base a elegir.',
    badge: 'Base a elegir',
    price: '159.00',
    imageUrl: 'https://placehold.co/400x300',
  },
  argTypes: {
    name: { description: 'Drink display name', control: { type: 'text' } },
    description: {
      description: 'Drink description',
      control: { type: 'text' },
    },
    badge: {
      description: 'Optional badge (bottle size / options)',
      control: { type: 'text' },
    },
    price: {
      description: 'Price as string, or null',
      control: { type: 'text' },
    },
    imageUrl: {
      description:
        'Image URL or null — no-image cards render at half width in the grid',
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof MenuDrinkCard>

export default meta
type Story = StoryObj<typeof meta>

/** Full-width image card — the whole card gently zooms on hover and lifts above neighbors (desktop pointers). */
export const WithImage: Story = {}

/** No-image card — occupies half the width of an image card in the drinks grid. */
export const NoImage: Story = {
  args: {
    name: 'Indio',
    description: '325 ml.',
    badge: null,
    price: '59.00',
    imageUrl: null,
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
