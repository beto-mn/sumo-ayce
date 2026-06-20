import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Sticker from './Sticker.vue'

const meta = {
  title: 'UI/Sticker',
  component: Sticker,
  tags: ['autodocs'],
  argTypes: {
    tone: {
      control: 'select',
      options: ['yellow', 'pink', 'orange', 'blue', 'green'],
    },
    rotate: { control: { type: 'number', min: -180, max: 180, step: 1 } },
  },
  render: args => ({
    components: { Sticker },
    setup: () => ({ args }),
    template: '<div class="p-12"><Sticker v-bind="args">$269</Sticker></div>',
  }),
} satisfies Meta<typeof Sticker>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { tone: 'yellow', rotate: -8 } }
export const Pink: Story = { args: { tone: 'pink', rotate: -8 } }
export const Orange: Story = { args: { tone: 'orange', rotate: -8 } }
export const Blue: Story = { args: { tone: 'blue', rotate: -8 } }
export const Green: Story = { args: { tone: 'green', rotate: -8 } }
export const YellowSlight: Story = { args: { tone: 'yellow', rotate: -2 } }
export const PinkPositive: Story = { args: { tone: 'pink', rotate: 6 } }

export const Mobile: Story = {
  args: { tone: 'yellow', rotate: -8 },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { tone: 'yellow', rotate: -8 },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
