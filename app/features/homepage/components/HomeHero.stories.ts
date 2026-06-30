import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeHero from './HomeHero.vue'

const meta = {
  title: 'Homepage/HomeHero',
  component: HomeHero,
  tags: ['autodocs'],
  argTypes: {
    price: {
      description:
        'Current AYCE price to display on the hero sticker (e.g., "$269")',
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof HomeHero>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { price: '$269' },
}

export const HigherPrice: Story = {
  args: { price: '$299' },
}

export const Mobile: Story = {
  args: { price: '$269' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { price: '$269' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}

/**
 * Reduced-motion: the tilted price sticker straightens via
 * `@media (prefers-reduced-motion: reduce)`. Toggle "Reduce motion" in your OS
 * accessibility settings to verify — no JS state involved. The marquee now
 * lives in a global band (SiteMarquee), not in the hero.
 */
export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { price: '$269' },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { price: '$269' },
  parameters: { globals: { locale: 'en' } },
}

export const ReducedMotion: Story = {
  args: { price: '$269' },
}
