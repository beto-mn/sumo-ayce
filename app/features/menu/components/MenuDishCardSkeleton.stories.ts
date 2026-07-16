import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuDishCardSkeleton from './MenuDishCardSkeleton.vue'

const meta = {
  title: 'Menu/MenuDishCardSkeleton',
  component: MenuDishCardSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof MenuDishCardSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** A single placeholder card matching `MenuDishCard`'s outer shell (image,
 *  title, description). */
export const Default: Story = {}

/** Fixed 6-card grid, mirroring `MenuDishGrid`'s
 *  `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` layout. */
export const Grid: Story = {
  render: () => ({
    components: { MenuDishCardSkeleton },
    template:
      '<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"><MenuDishCardSkeleton v-for="n in 6" :key="n" /></div>',
  }),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
