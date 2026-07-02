import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Menu feature slice — overview index.
 *
 * Documents the components that compose the menu page. Each component has its
 * own dedicated stories under `Menu/*`; this Docs entry is a navigable summary
 * of the slice.
 */
const meta: Meta = {
  title: 'Features/Menu',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Menu Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>MenuShell</strong> — page shell wrapping the menu with loading and empty states.</li>
          <li><strong>MenuTypeToggle</strong> — AYCE vs. Express line toggle.</li>
          <li><strong>MenuModalityToggle</strong> — dine-in vs. takeaway modality toggle.</li>
          <li><strong>MenuCategoryChips</strong> — category filter chips.</li>
          <li><strong>MenuDishGrid</strong> — responsive grid of dishes with loading and empty states.</li>
          <li><strong>MenuDishCard</strong> — single dish card used inside the grid.</li>
          <li><strong>MenuDrinkSection</strong> — drinks listing section.</li>
          <li><strong>MenuSaucePicker</strong> — sauce selection control.</li>
        </ul>
      </div>
    `,
  }),
}
