import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Kicker from './Kicker.vue'

const meta = {
  title: 'UI/Kicker',
  component: Kicker,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      description: 'Color tone of the kicker label. Blue is Express-only.',
      control: { type: 'select' },
      options: ['ink', 'accent', 'orange', 'pink', 'blue', 'yellow'],
    },
    rotate: {
      description: 'Rotation in degrees for the playful tilt effect',
      control: { type: 'number', min: -180, max: 180, step: 1 },
    },
  },
  render: args => ({
    components: { Kicker },
    setup: () => ({ args }),
    template:
      '<div class="p-6"><Kicker v-bind="args">Come sin límites</Kicker></div>',
  }),
} satisfies Meta<typeof Kicker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { tone: 'ink', rotate: -2 } }
export const AccentAyce: Story = { args: { tone: 'accent', rotate: -2 } }

/**
 * Section kickers: orange (featured/branches), pink (promos), yellow (reviews).
 * Blue is reserved for Express-scoped sections only (Constitution Art. VII).
 */
export const Orange: Story = { args: { tone: 'orange', rotate: -2 } }
export const Pink: Story = { args: { tone: 'pink', rotate: -2 } }
export const Yellow: Story = { args: { tone: 'yellow', rotate: -2 } }

/** Express-only: ink/dark text not required, light text on blue surface. */
export const Blue: Story = { args: { tone: 'blue', rotate: -2 } }

export const AccentExpress: Story = {
  args: { tone: 'accent', rotate: -2 },
  render: args => ({
    components: { Kicker },
    setup: () => ({ args }),
    template:
      '<div class="scope-express p-6"><Kicker v-bind="args">Express</Kicker></div>',
  }),
}

export const LocaleES: Story = {
  args: { tone: 'ink', rotate: -2 },
  render: args => ({
    components: { Kicker },
    setup: () => ({ args }),
    template:
      '<div class="p-6"><Kicker v-bind="args">Come sin límites</Kicker></div>',
  }),
}

export const LocaleEN: Story = {
  args: { tone: 'ink', rotate: -2 },
  render: args => ({
    components: { Kicker },
    setup: () => ({ args }),
    template:
      '<div class="p-6"><Kicker v-bind="args">Eat Without Limits</Kicker></div>',
  }),
}

export const Mobile: Story = {
  args: { tone: 'ink', rotate: -2 },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { tone: 'ink', rotate: -2 },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
