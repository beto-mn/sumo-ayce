import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Branches feature slice — overview index.
 *
 * Documents the components that make up the branch-finder experience. Each
 * component has its own dedicated stories under `Branches/*`; this Docs entry
 * is a navigable summary of the slice.
 */
const meta: Meta = {
  title: 'Features/Branches',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Branches Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>BranchCard</strong> — single branch summary card with type accent, address, distance and phone.</li>
          <li><strong>BranchList</strong> — responsive grid of BranchCards with loading and empty states.</li>
          <li><strong>BranchSearch</strong> — postal-code / geolocation search field for the branch finder.</li>
        </ul>
      </div>
    `,
  }),
}
