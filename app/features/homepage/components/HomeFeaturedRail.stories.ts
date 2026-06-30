import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FeaturedDish } from '@/types/content'
import HomeFeaturedRail from './HomeFeaturedRail.vue'

function dish(id: string, name: string, imageUrl: string | null): FeaturedDish {
  return {
    id,
    name,
    description: { es: 'Descripción.', en: 'Description.' },
    imageUrl,
    badge: null,
    category: 'frio',
  }
}

const dishes: FeaturedDish[] = [
  dish('1', 'Salmón Nigiri', '/hero-placeholder.svg'),
  dish('2', 'Sumo Roll', null),
  dish('3', 'Alitas Sumo', '/hero-placeholder.svg'),
  dish('4', 'Gyoza', null),
]

const meta = {
  title: 'Homepage/HomeFeaturedRail',
  component: HomeFeaturedRail,
  tags: ['autodocs'],
  argTypes: {
    dishes: {
      description:
        'Array of featured dish objects to display in the horizontal rail',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof HomeFeaturedRail>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { dishes },
}

export const Empty: Story = {
  args: { dishes: [] },
}

export const Mobile: Story = {
  args: { dishes },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { dishes },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
