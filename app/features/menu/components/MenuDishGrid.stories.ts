import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuCategory } from '@/types/menu'
import MenuDishGrid from './MenuDishGrid.vue'

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    note: null,
    displayOrder: 0,
    dishes: [
      {
        id: 'd1',
        name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
        description: {
          es: 'Salmón flameado con aguacate.',
          en: 'Flamed salmon with avocado.',
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
        includedInAyce: true,
        drinkGroup: null,
        drinkSubGroup: null,
        requiresSauce: false,
        featured: false,
      },
    ],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    note: null,
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
        includedInAyce: true,
        drinkGroup: null,
        drinkSubGroup: null,
        requiresSauce: false,
        featured: false,
      },
    ],
  },
]

const meta = {
  title: 'Menu/MenuDishGrid',
  component: MenuDishGrid,
  tags: ['autodocs'],
  args: { categories, modality: 'buffet' },
  argTypes: {
    categories: {
      description:
        'The single active category (as a one-element array) to render',
      control: { type: 'object' },
    },
    modality: {
      description:
        'Menu modality: buffet (all-inclusive) or carta (a la carte with prices)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
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
        note: null,
        displayOrder: 0,
        dishes: [
          {
            id: 'd1-carta',
            name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
            description: {
              es: 'Salmón flameado con aguacate.',
              en: 'Flamed salmon with avocado.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '128.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            requiresSauce: false,
            featured: false,
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
        note: null,
        displayOrder: 0,
        dishes: [],
      },
    ],
  },
}

/**
 * Kids view — the TWO ordered sub-sections the Kids primary type renders:
 * 1) "All You Can Eat Kids" ($179 buffet, no note); 2) "Combo Infantil" (the
 * $149 combos) with the inclusion NOTE (yellow pop box) at the top of that
 * section only. Headings are i18n copy; the note is DB-driven.
 */
export const KidsList: Story = {
  args: {
    modality: 'carta',
    categories: [
      {
        key: 'kids',
        name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
        note: null,
        displayOrder: 0,
        dishes: [
          {
            id: 'kids-ayce',
            name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
            description: {
              es: 'Buffet all you can eat para niños de 2 a 10 años. Precio por persona, promoción individual (no para compartir).',
              en: 'All you can eat buffet for children ages 2 to 10. Price per person, individual promotion (not for sharing).',
            },
            imageUrl: null,
            badge: null,
            price: '179.00',
            incluido: false,
            includedInAyce: true,
            drinkGroup: null,
            drinkSubGroup: null,
            requiresSauce: false,
            featured: false,
          },
        ],
      },
      {
        key: 'kids',
        name: { es: 'Combo Infantil', en: 'Kids Combo' },
        note: {
          es: 'Incluye papas a la francesa (100 g), refresco (400 ml), sushi kids (5 pzas de cualquier rollo de nuestra carta) y un yakimeshi (240 g).',
          en: 'Includes french fries (100 g), a soft drink (400 ml), sushi kids (5 pcs of any roll from our menu) and a yakimeshi (240 g).',
        },
        displayOrder: 1,
        dishes: [
          {
            id: 'kid-burger',
            name: { es: 'Kid Burger', en: 'Kid Burger' },
            description: {
              es: '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
              en: '60g smash beef patty with American cheese, lettuce and American dressing. Served with french fries.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '149.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            requiresSauce: false,
            featured: false,
          },
        ],
      },
    ],
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
