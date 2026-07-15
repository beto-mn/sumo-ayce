import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { CategoryChip } from './MenuCategoryChips.vue'
import MenuCategoryChips from './MenuCategoryChips.vue'

// Labels are DB-sourced (name[locale]) and passed in by the parent — the chip
// no longer resolves i18n itself. These fixtures mirror the seeded DB names.
const AYCE_BUFFET_CHIPS: CategoryChip[] = [
  { key: 'appetizers', label: 'Entradas' },
  { key: 'burgers', label: 'Hamburguesas' },
  { key: 'sandwiches', label: 'Sándwiches' },
  { key: 'hot_dogs', label: 'Hot Dogs' },
  { key: 'cold_rolls', label: 'Sushi Frío' },
  { key: 'hot_rolls', label: 'Sushi Caliente' },
  { key: 'sweet_rolls', label: 'Sushi Dulce' },
  { key: 'wings', label: 'Alitas & Boneless' },
]

const AYCE_CARTA_CHIPS: CategoryChip[] = [
  { key: 'appetizers', label: 'Entradas' },
  { key: 'salads', label: 'Ensaladas' },
  { key: 'rice', label: 'Arroz' },
  { key: 'ramen', label: 'Ramen' },
  { key: 'burgers', label: 'Hamburguesas' },
  { key: 'desserts', label: 'Postres' },
  { key: 'kids', label: 'Menú Kids' },
]

const DRINKS_CHIPS: CategoryChip[] = [
  { key: 'jumbo_cocktails', label: 'Coctelería Jumbo' },
  { key: 'cantaritos_sumo_cups', label: 'Cantaritos y Vasos Sumo' },
  { key: 'sodas', label: 'Refrescos y Bebidas' },
  { key: 'beers', label: 'Cervezas' },
  { key: 'destilados', label: 'Destilados' },
  { key: 'coffee_digestifs', label: 'Café y Digestivos' },
]

const meta = {
  title: 'Menu/MenuCategoryChips',
  component: MenuCategoryChips,
  tags: ['autodocs'],
  args: { items: AYCE_BUFFET_CHIPS, activeCategory: 'appetizers' },
  argTypes: {
    items: {
      description:
        'Ordered chips with their DB-sourced labels ({ key, label }). The parent resolves label from the API menu data (name[locale]).',
      control: { type: 'object' },
    },
    activeCategory: {
      description: 'Key of the single active chip (never null — no show-all)',
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof MenuCategoryChips>

export default meta
type Story = StoryObj<typeof meta>

export const AyceBuffetSet: Story = {}

export const AyceCartaSet: Story = {
  args: { items: AYCE_CARTA_CHIPS, activeCategory: 'ramen' },
}

export const DrinksSet: Story = {
  args: { items: DRINKS_CHIPS, activeCategory: 'jumbo_cocktails' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
