import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SiteLogo from './SiteLogo.vue'

/**
 * Shared SUMO brand mark used by both `SiteHeader` and `SiteFooter`. Renders the
 * ORIGINAL, unmodified horizontal lockup (`/brand/sumo-horizontal.svg`). It is
 * rendered BARE (no backing box): the SVG's own black sticker outline keeps the
 * white wordmark legible on the cream nav, and the white wordmark shows on the
 * ink footer.
 */
const meta = {
  title: 'Layout/SiteLogo',
  component: SiteLogo,
  tags: ['autodocs'],
  args: { to: '/', label: 'SUMO — All You Can Eat' },
  argTypes: {
    to: {
      description: 'Navigation destination for the logo link',
      control: { type: 'text' },
    },
    label: {
      description: 'Accessible label for the logo link (screen readers)',
      control: { type: 'text' },
    },
    size: {
      description: 'Visual size of the logo',
      control: { type: 'select' },
      options: ['default', 'small'],
    },
  },
} satisfies Meta<typeof SiteLogo>

export default meta
type Story = StoryObj<typeof meta>

/** Default bare logo on the cream nav. */
export const Default: Story = {}

export const Small: Story = {
  args: { size: 'small' },
}

/** Bare logo on the ink footer — the white wordmark shows directly, no box. */
export const OnInk: Story = {
  decorators: [
    () => ({
      template: '<div class="bg-ink p-8 inline-block"><story /></div>',
    }),
  ],
}

export const OnCream: Story = {
  decorators: [
    () => ({
      template: '<div class="bg-bg p-8 inline-block"><story /></div>',
    }),
  ],
}
