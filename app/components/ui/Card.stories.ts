import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Card from './Card.vue'

const meta = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    accent: { control: 'select', options: ['ayce', 'express'] },
    tone: { control: 'select', options: ['panel', 'bg2'] },
    shadowSize: { control: 'select', options: ['lg', 'sm'] },
  },
  render: args => ({
    components: { Card },
    setup: () => ({ args }),
    template: `
      <Card v-bind="args">
        <h3 class="font-disp text-h-lg uppercase">All You Can Eat</h3>
        <p class="text-soft">Estilo americano-japonés.</p>
        <span class="inline-block mt-3 px-3 py-1 rounded-pop-full border-pop-sm border-ink bg-accent text-bg font-disp uppercase text-kicker">Reservar</span>
      </Card>`,
  }),
} satisfies Meta<typeof Card>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { accent: 'ayce', tone: 'panel', shadowSize: 'lg' },
}
export const AyceBg2: Story = {
  args: { accent: 'ayce', tone: 'bg2', shadowSize: 'lg' },
}
export const Express: Story = {
  args: { accent: 'express', tone: 'panel', shadowSize: 'lg' },
}
export const ExpressBg2: Story = {
  args: { accent: 'express', tone: 'bg2', shadowSize: 'lg' },
}
export const SmallShadow: Story = {
  args: { accent: 'ayce', tone: 'panel', shadowSize: 'sm' },
}

export const AyceVsExpress: Story = {
  args: { accent: 'ayce' },
  render: () => ({
    components: { Card },
    template: `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
        <Card accent="ayce">
          <h3 class="font-disp text-h-lg uppercase">SUMO AYCE</h3>
          <p class="text-soft">Orange accent.</p>
          <span class="inline-block mt-3 px-3 py-1 rounded-pop-full border-pop-sm border-ink bg-accent text-bg font-disp uppercase text-kicker">Accent</span>
        </Card>
        <Card accent="express">
          <h3 class="font-disp text-h-lg uppercase">SUMO Express</h3>
          <p class="text-soft">Blue accent.</p>
          <span class="inline-block mt-3 px-3 py-1 rounded-pop-full border-pop-sm border-ink bg-accent text-bg font-disp uppercase text-kicker">Accent</span>
        </Card>
      </div>`,
  }),
}

export const Mobile: Story = {
  args: { accent: 'ayce' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { accent: 'ayce' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
