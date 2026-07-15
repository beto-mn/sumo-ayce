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
        <p>The promotions page and the homepage share one carousel primitive:</p>
        <ul>
          <li><strong>UiPromotionsCarousel</strong> (<code>components/ui</code>) — Embla touch/drag carousel with dots + arrows, rendering one <strong>UiPromotionCard</strong> per slide.</li>
          <li><strong>UiPromotionCard</strong> (<code>components/ui</code>) — responsive &lt;picture&gt; slide with a color badge overlay.</li>
        </ul>
        <p>The page fetches <code>/api/v1/content/promotions?all=1</code> and shows an empty state when there are no active promotions.</p>
      </div>
    `,
  }),
}
