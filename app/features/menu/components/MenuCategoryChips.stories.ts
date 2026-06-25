import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuCategory } from '@/types/menu'
import MenuCategoryChips from './MenuCategoryChips.vue'

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    displayOrder: 0,
    dishes: [],
  },
  {
    key: 'hot_rolls',
    name: { es: 'Sushi Caliente', en: 'Hot Rolls' },
    displayOrder: 1,
    dishes: [],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    displayOrder: 2,
    dishes: [],
  },
  {
    key: 'burgers',
    name: { es: 'Burgers', en: 'Burgers' },
    displayOrder: 3,
    dishes: [],
  },
]

const meta = {
  title: 'Menu/MenuCategoryChips',
  component: MenuCategoryChips,
  tags: ['autodocs'],
  args: { categories, activeCategory: null },
} satisfies Meta<typeof MenuCategoryChips>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { activeCategory: null },
}

export const WithActiveCategory: Story = {
  args: { activeCategory: 'wings' },
}

export const Mobile: Story = {
  args: { activeCategory: null },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
