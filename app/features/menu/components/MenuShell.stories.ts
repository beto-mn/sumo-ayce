import type { Decorator, Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuResult } from '@/types/menu'
import MenuCategoryChips from './MenuCategoryChips.vue'
import MenuDishGrid from './MenuDishGrid.vue'
import MenuDrinkSection from './MenuDrinkSection.vue'
import MenuModalityToggle from './MenuModalityToggle.vue'
import MenuShell from './MenuShell.vue'
import MenuTypeToggle from './MenuTypeToggle.vue'

const menuData: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [
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
          imageUrl: null,
          badge: null,
          price: null,
          incluido: true,
          drinkGroup: null,
          drinkSubGroup: null,
          requiresSauce: false,
        },
      ],
    },
    {
      key: 'drinks',
      name: { es: 'Bebidas', en: 'Drinks' },
      displayOrder: 1,
      dishes: [
        {
          id: 'dr1',
          name: { es: 'Coca-Cola', en: 'Coca-Cola' },
          description: { es: 'Refresco 500 ml.', en: '500 ml soda.' },
          imageUrl: null,
          badge: null,
          price: '50.00',
          incluido: false,
          drinkGroup: 'sodas',
          drinkSubGroup: null,
          requiresSauce: false,
        },
      ],
    },
  ],
  sauces: [
    {
      id: 's1',
      name: { es: 'Honey Mustard', en: 'Honey Mustard' },
      imageUrl: null,
      spiceLevel: 0,
    },
  ],
}

const meta = {
  title: 'Menu/MenuShell',
  component: MenuShell,
  tags: ['autodocs'],
  args: {
    menuData,
    initialType: 'ayce',
    initialModality: 'buffet',
  },
  argTypes: {
    menuData: {
      description:
        'Complete menu data result including categories, sauces, and locationType',
      control: { type: 'object' },
    },
    initialType: {
      description: 'Initial menu type to display: ayce or express',
      control: { type: 'select' },
      options: ['ayce', 'express'],
    },
    initialModality: {
      description:
        'Initial menu modality: buffet (all-inclusive) or carta (a la carte)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
  decorators: [
    (story => ({
      components: {
        story,
        MenuTypeToggle,
        MenuModalityToggle,
        MenuCategoryChips,
        MenuDishGrid,
        MenuDrinkSection,
      },
      template: '<story />',
    })) as Decorator,
  ],
} satisfies Meta<typeof MenuShell>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const ExpressType: Story = {
  args: {
    initialType: 'express',
    menuData: { ...menuData, locationType: 'express' },
  },
}

export const CartaModality: Story = {
  args: { initialModality: 'carta' },
}

export const Empty: Story = {
  args: {
    menuData: { ...menuData, categories: [] },
    initialType: 'ayce',
    initialModality: 'buffet',
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
