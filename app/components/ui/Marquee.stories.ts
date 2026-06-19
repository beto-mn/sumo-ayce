import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Marquee from './Marquee.vue'

const meta = {
  title: 'UI/Marquee',
  component: Marquee,
  tags: ['autodocs'],
  argTypes: {
    speed: { control: 'select', options: ['slow', 'normal', 'fast'] },
    direction: { control: 'select', options: ['left', 'right'] },
    pauseOnHover: { control: 'boolean' },
    tone: { control: 'select', options: ['yellow', 'ink'] },
  },
  render: args => ({
    components: { Marquee },
    setup: () => ({ args }),
    template: `
      <Marquee v-bind="args">
        <span class="font-disp font-extrabold uppercase text-kicker">All You Can Eat</span>
        <span class="font-disp font-extrabold uppercase text-kicker">★</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Estilo americano-japonés</span>
        <span class="font-disp font-extrabold uppercase text-kicker">★</span>
        <span class="font-disp font-extrabold uppercase text-kicker">$269</span>
        <span class="font-disp font-extrabold uppercase text-kicker">★</span>
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
        <span class="font-disp font-extrabold uppercase text-kicker">Smash Burgers</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange">✳</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Sushi Ilimitado</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange">✳</span>
        <span class="font-disp font-extrabold uppercase text-kicker">Ramen 12 h de Caldo</span>
        <span class="font-disp font-extrabold uppercase text-kicker text-orange">✳</span>
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

export const Mobile: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { speed: 'normal', direction: 'left', pauseOnHover: true },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
