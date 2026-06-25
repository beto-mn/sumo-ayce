import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuCategory, FullMenuSauce } from '@/types/menu'
import MenuDishGrid from './MenuDishGrid.vue'

const sauces: FullMenuSauce[] = [
  {
    id: 's1',
    name: { es: 'Honey Mustard', en: 'Honey Mustard' },
    spiceLevel: 0,
  },
  { id: 's2', name: { es: 'Buffalo', en: 'Buffalo' }, spiceLevel: 2 },
]

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    displayOrder: 0,
    dishes: [
      {
        id: 'd1',
        name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
        description: {
          es: 'Salmón flameado con aguacate.',
          en: 'Flamed salmon with avocado.',
        },
        imageUrl: '/menu/ayce/bora_bora.webp',
        badge: null,
        price: null,
        incluido: true,
        drinkGroup: null,
        drinkSubGroup: null,
        requiresSauce: false,
      },
      {
        id: 'd2',
        name: { es: 'Spider Roll', en: 'Spider Roll' },
        description: {
          es: 'Cangrejo de caparazón blando.',
          en: 'Soft-shell crab.',
        },
        imageUrl: null,
        badge: { es: 'Nuevo', en: 'New' },
        price: null,
        incluido: true,
        drinkGroup: null,
        drinkSubGroup: null,
        requiresSauce: false,
      },
    ],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    displayOrder: 1,
    dishes: [
      {
        id: 'd3',
        name: { es: 'Boneless', en: 'Boneless' },
        description: {
          es: 'Pieza de pollo empanizado.',
          en: 'Breaded chicken piece.',
        },
        imageUrl: null,
        badge: null,
        price: null,
        incluido: true,
        drinkGroup: null,
        drinkSubGroup: null,
        requiresSauce: true,
      },
    ],
  },
]

const meta = {
  title: 'Menu/MenuDishGrid',
  component: MenuDishGrid,
  tags: ['autodocs'],
  args: { categories, sauces, modality: 'buffet' },
} satisfies Meta<typeof MenuDishGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CartaModality: Story = {
  args: {
    modality: 'carta',
    categories: [
      {
        key: 'cold_rolls',
        name: { es: 'Sushi Frío', en: 'Cold Rolls' },
        displayOrder: 0,
        dishes: [
          {
            id: 'd1-carta',
            name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
            description: {
              es: 'Salmón flameado con aguacate.',
              en: 'Flamed salmon with avocado.',
            },
            imageUrl: '/menu/ayce/bora_bora.webp',
            badge: null,
            price: '128.00',
            incluido: false,
            drinkGroup: null,
            drinkSubGroup: null,
            requiresSauce: false,
          },
        ],
      },
    ],
  },
}

export const EmptyCategory: Story = {
  args: {
    categories: [
      {
        key: 'ramen',
        name: { es: 'Ramen', en: 'Ramen' },
        displayOrder: 0,
        dishes: [],
      },
    ],
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
