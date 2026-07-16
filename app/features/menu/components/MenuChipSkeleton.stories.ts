import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuChipSkeleton from './MenuChipSkeleton.vue'

const meta = {
  title: 'Menu/MenuChipSkeleton',
  component: MenuChipSkeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof MenuChipSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** A single pill-shaped placeholder, sized to match a real `UiChip`. */
export const Default: Story = {}

/** Several placeholders side by side, mirroring how `MenuCategoryChips`
 *  wraps chips in a `flex flex-wrap gap-2` row. */
export const Row: Story = {
  render: () => ({
    components: { MenuChipSkeleton },
    template:
      '<div class="flex flex-wrap gap-2"><MenuChipSkeleton v-for="n in 8" :key="n" /></div>',
  }),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
