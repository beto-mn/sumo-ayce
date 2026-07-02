import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Marquee from './Marquee.vue'

const meta = {
  title: 'UI/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  argTypes: {
    speed: {
      description: 'Animation speed of the scrolling marquee',
      control: { type: 'select' },
      options: ['slow', 'normal', 'fast'],
    },
    direction: {
      description: 'Scroll direction of the marquee content',
      control: { type: 'select' },
      options: ['left', 'right'],
    },
    pauseOnHover: {
      description: 'Pauses the animation when the user hovers over it',
      control: { type: 'boolean' },
    },
    tone: {
      description: 'Background color tone of the marquee band',
      control: { type: 'select' },
      options: ['yellow', 'ink'],
    },
  },
  render: args => ({
    components: { Marquee },
    setup: () => ({ args }),
    template: `
      <Marquee v-bind="args">
        <span class="font-disp font-extrabold uppercase text-kicker">All You Can Eat</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Buffet preparado al instante</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">$269 todos los días</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
      </Marquee>`,
  }),
} satisfies Meta<typeof Marquee>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
}

/** Dark band with light text — used as the global homepage marquee. */
export const InkTone: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true, tone: 'ink' },
  render: args => ({
    components: { Marquee },
    setup: () => ({ args }),
    template: `
      <Marquee v-bind="args">
        <span class="font-disp font-extrabold uppercase text-kicker">Sushi ilimitado</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Ramen 12 h de caldo</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Teppanyaki en vivo</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Smash burgers</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">$269 todos los días</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
      </Marquee>`,
  }),
}
export const Slow: Story = {
  args: { speed: 'slow', direction: 'left', pauseOnHover: true },
}
export const Fast: Story = {
  args: { speed: 'fast', direction: 'left', pauseOnHover: true },
}
export const Right: Story = {
  args: { speed: 'normal', direction: 'right', pauseOnHover: true },
}
export const NoPauseOnHover: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: false },
}

/**
 * Reduced-motion is gated via the `@media (prefers-reduced-motion: reduce)`
 * rule in Marquee.vue. To verify, toggle "Reduce motion" in your OS preferences
 * (macOS: System Settings → Accessibility → Display). The animation should
 * pause and the content render visually static — no JS state involved.
 */
export const ReducedMotion: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
}

export const LocaleES: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  render: args => ({
    components: { Marquee },
    setup: () => ({ args }),
    template: `
      <Marquee v-bind="args">
        <span class="font-disp font-extrabold uppercase text-kicker">Sushi ilimitado</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Ramen 12 h de caldo</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Teppanyaki en vivo</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Smash burgers</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">$269 todos los días</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
      </Marquee>`,
  }),
}

export const LocaleEN: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  render: args => ({
    components: { Marquee },
    setup: () => ({ args }),
    template: `
      <Marquee v-bind="args">
        <span class="font-disp font-extrabold uppercase text-kicker">Unlimited sushi</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">12-hour ramen broth</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Live teppanyaki</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Smash burgers</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
        <span class="font-disp font-extrabold uppercase text-kicker">$269 every day</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange" aria-hidden="true">✺</span>
      </Marquee>`,
  }),
}

export const Mobile: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
