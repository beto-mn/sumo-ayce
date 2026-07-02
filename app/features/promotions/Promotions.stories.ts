import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Promotions feature slice — overview index.
 *
 * Documents the components that compose the promotions page. Each component has
 * its own dedicated stories under `Promotions/*`; this Docs entry is a
 * navigable summary of the slice.
 */
const meta: Meta = {
  title: 'Features/Promotions',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Promotions Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>PromotionsGrid</strong> — responsive grid of PromotionCards with an empty state.</li>
        </ul>
      </div>
    `,
  }),
}
