import type { Meta, StoryObj } from '@storybook/vue3-vite'
import HomeHero from './HomeHero.vue'

const meta = {
  title: 'Homepage/HomeHero',
  component: HomeHero,
  tags: ['autodocs'],
  parameters: {
    // A11Y EXCEPTION (brand lettering): the "ALL YOU CAN EAT" headline uses a
    // logo-style treatment — white fill (--panel) over the cream hero with a
    // thick black outline (--ink) via -webkit-text-stroke. axe's `color-contrast`
    // rule measures fill-vs-background only and cannot see the stroke, so it
    // would report a false positive; real legibility comes from the black
    // outline. We disable ONLY that one rule for this component (all other a11y
    // checks stay on), the same way one would for display lettering of a logo.
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
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

/**
 * Reduced-motion: the "ALL YOU / CAN EAT" headline keeps its static staggered
 * rotation but its settle-in animation is disabled via
 * `@media (prefers-reduced-motion: reduce)`; the tilted price sticker also
 * straightens. Toggle "Reduce motion" in your OS accessibility settings to
 * verify — no JS state involved.
 */
export const ReducedMotion: Story = {
  args: { price: '$269' },
}
