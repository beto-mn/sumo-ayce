import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * UI Primitives — overview index.
 *
 * Documents the cross-feature primitives (`ui/`), the app shell (`layout/`)
 * and the staff-portal building blocks (`staff/`). Each component has its own
 * dedicated stories; this Docs entry is a navigable summary of the shared
 * component surface.
 */
const meta: Meta = {
  title: 'UI Primitives',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 720px;">
        <h1>UI Primitives</h1>

        <h2>Primitives (app/components/ui)</h2>
        <ul>
          <li><strong>Button</strong> — primary action button with variants, sizes and disabled state.</li>
          <li><strong>Card</strong> — pop-styled container with border, shadow and optional accent.</li>
          <li><strong>Chip</strong> — pill filter chip with active and accent variants.</li>
          <li><strong>Input</strong> — text field with label, error and disabled states.</li>
          <li><strong>Select</strong> — dropdown field with label, error and disabled states.</li>
          <li><strong>Textarea</strong> — multi-line field with label, error and disabled states.</li>
          <li><strong>Kicker</strong> — small rotated eyebrow label.</li>
          <li><strong>Lightbox</strong> — modal image viewer with focus trap.</li>
          <li><strong>MapView</strong> — Mapbox branch map (rendered as a stub in Storybook).</li>
          <li><strong>Marquee</strong> — scrolling ticker band.</li>
          <li><strong>Nav</strong> — top navigation bar.</li>
          <li><strong>PageHeader</strong> — page title header with kicker and subtitle.</li>
          <li><strong>PromotionCard</strong> — promotion card with badge, validity and type accent.</li>
          <li><strong>Sticker</strong> — rotated sticker badge.</li>
          <li><strong>Tokens</strong> — design-token smoke test.</li>
        </ul>

        <h2>Layout (app/components/layout)</h2>
        <ul>
          <li><strong>SiteLogo</strong> — unmodified SUMO logo at configurable sizes.</li>
          <li><strong>SiteHeader</strong> — app header shell composing Nav and logo.</li>
          <li><strong>SiteFooter</strong> — app footer shell.</li>
          <li><strong>SiteMarquee</strong> — site-wide marquee band.</li>
        </ul>

        <h2>Staff (app/components/staff)</h2>
        <ul>
          <li><strong>CustomerCard</strong> — loyalty customer summary card.</li>
          <li><strong>LoginForm</strong> — staff login form with error state.</li>
          <li><strong>RewardsList</strong> — list of loyalty rewards with empty state.</li>
          <li><strong>TransactionTable</strong> — loyalty transactions table with loading and empty states.</li>
          <li><strong>VisitButton</strong> — visit-validation action button with disabled state.</li>
        </ul>
      </div>
    `,
  }),
}
