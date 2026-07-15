import type { Decorator, Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuResult } from '@/types/menu'
import MenuCategoryChips from './MenuCategoryChips.vue'
import MenuDishCard from './MenuDishCard.vue'
import MenuDishGrid from './MenuDishGrid.vue'
import MenuDrinkSection from './MenuDrinkSection.vue'
import MenuModalityToggle from './MenuModalityToggle.vue'
import MenuSaucePicker from './MenuSaucePicker.vue'
import MenuShell from './MenuShell.vue'
import MenuTypeToggle from './MenuTypeToggle.vue'

const menuData: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [
    {
      key: 'appetizers',
      name: { es: 'Entradas', en: 'Appetizers' },
      note: null,
      displayOrder: 0,
      dishes: [
        {
          id: 'd1',
          name: { es: 'Edamames', en: 'Edamame' },
          description: {
            es: 'Vainas de soya al vapor con sal de mar.',
            en: 'Steamed soybean pods with sea salt.',
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
    {
      key: 'drinks',
      name: { es: 'Bebidas', en: 'Drinks' },
      note: null,
      displayOrder: 1,
      dishes: [
        {
          id: 'dr1',
          name: { es: 'Refresco', en: 'Soda' },
          description: { es: '355 ml.', en: '355 ml.' },
          imageUrl: null,
          badge: null,
          price: '69.00',
          incluido: false,
          includedInAyce: false,
          drinkGroup: 'sodas',
          drinkSubGroup: null,
          requiresSauce: false,
          featured: false,
        },
      ],
    },
    {
      key: 'kids',
      name: { es: 'Menú Kids', en: 'Kids Menu' },
      note: {
        es: 'Incluye papas a la francesa (100 g), refresco (400 ml), sushi kids (5 pzas de cualquier rollo de nuestra carta) y un yakimeshi (240 g).',
        en: 'Includes french fries (100 g), a soft drink (400 ml), sushi kids (5 pcs of any roll from our menu) and a yakimeshi (240 g).',
      },
      displayOrder: 2,
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
        {
          id: 'k1',
          name: { es: 'Kid Burger', en: 'Kid Burger' },
          description: {
            es: '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
            en: '60g smash beef patty with American cheese, lettuce and American dressing. Served with french fries.',
          },
          imageUrl: null,
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
  sauces: [],
  drinkGroups: [
    {
      key: 'jumbo_cocktails',
      name: { es: 'Coctelería Jumbo', en: 'Jumbo Cocktails' },
      displayOrder: 0,
      promo: null,
    },
    {
      key: 'sodas',
      name: { es: 'Refrescos y Bebidas', en: 'Sodas & Beverages' },
      displayOrder: 2,
      promo: null,
    },
  ],
}

const meta = {
  title: 'Menu/MenuShell',
  component: MenuShell,
  tags: ['autodocs'],
  args: {
    menuData,
    initialSelection: 'ayce',
    initialModality: 'buffet',
  },
  argTypes: {
    menuData: {
      description:
        'Complete menu result (categories, sauces, drink-group meta)',
      control: { type: 'object' },
    },
    initialSelection: {
      description:
        'Initial primary selection: ayce, express, drinks (Bebidas) or kids',
      control: { type: 'select' },
      options: ['ayce', 'express', 'drinks', 'kids'],
    },
    initialModality: {
      description: 'Initial AYCE modality: buffet or carta',
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
        MenuDishCard,
        MenuSaucePicker,
        MenuDrinkSection,
      },
      template: '<story />',
    })) as Decorator,
  ],
} satisfies Meta<typeof MenuShell>

export default meta
type Story = StoryObj<typeof meta>

/** Default landing: AYCE · All You Can Eat · Entradas (single category). */
export const Default: Story = {}

export const ExpressSelection: Story = {
  args: {
    initialSelection: 'express',
    menuData: { ...menuData, locationType: 'express' },
  },
}

export const CartaModality: Story = {
  args: { initialModality: 'carta' },
}

export const BebidasSelection: Story = {
  args: { initialSelection: 'drinks' },
}

/**
 * Kids view: the standalone Kids primary type renders TWO ordered sub-sections —
 * "All You Can Eat Kids" ($179 buffet) then "Combo Infantil" ($149 combos) with
 * the inclusion note at the top of the Combo section — with NO category-chip row
 * and NO modality toggle, using the same soft/ink accent as Bebidas (both are
 * cross-cutting views).
 */
export const KidsSelection: Story = {
  args: { initialSelection: 'kids' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
