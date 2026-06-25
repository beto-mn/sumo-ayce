import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuDish } from '@/types/menu'
import MenuDrinkSection from './MenuDrinkSection.vue'

const drinks: FullMenuDish[] = [
  {
    id: 'dr1',
    name: { es: 'Margarita Jumbo', en: 'Jumbo Margarita' },
    description: { es: 'Tequila, limón y sal.', en: 'Tequila, lime and salt.' },
    imageUrl: null,
    badge: null,
    price: '180.00',
    incluido: false,
    drinkGroup: 'jumbo_cocktails',
    drinkSubGroup: null,
    requiresSauce: false,
  },
  {
    id: 'dr2',
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
  {
    id: 'dr3',
    name: { es: 'Agua Mineral', en: 'Sparkling Water' },
    description: { es: 'Agua mineral 355 ml.', en: '355 ml sparkling water.' },
    imageUrl: null,
    badge: null,
    price: '40.00',
    incluido: false,
    drinkGroup: 'non_alcoholic',
    drinkSubGroup: null,
    requiresSauce: false,
  },
]

const meta = {
  title: 'Menu/MenuDrinkSection',
  component: MenuDrinkSection,
  tags: ['autodocs'],
  args: { drinks },
} satisfies Meta<typeof MenuDrinkSection>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const FilteredGroup: Story = {
  args: { activeGroup: 'sodas' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
