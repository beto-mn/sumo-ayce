import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Homepage feature slice — overview index.
 *
 * Documents the components that compose the landing page. Each component has
 * its own dedicated stories under `Homepage/*`; this Docs entry is a navigable
 * summary of the slice.
 */
const meta: Meta = {
  title: 'Features/Homepage',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Homepage Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>HomeHero</strong> — top hero with All You Can Eat headline and price.</li>
          <li><strong>HomeTypeSelector</strong> — AYCE vs. Express line chooser.</li>
          <li><strong>HomeFeaturedRail</strong> — horizontal rail of featured dishes with loading and empty states.</li>
          <li><strong>DishCard</strong> — single featured dish card used inside the rail.</li>
          <li><strong>HomePromotions</strong> — promotions preview block.</li>
          <li><strong>HomeReviews</strong> — customer reviews section.</li>
          <li><strong>ReviewCard</strong> — single review card with author and rating.</li>
          <li><strong>HomeBranchesCta</strong> — call-to-action linking to the branch finder.</li>
        </ul>
      </div>
    `,
  }),
}
