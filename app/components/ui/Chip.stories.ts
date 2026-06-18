import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Chip from './Chip.vue'

const meta = {
  title: 'UI/Chip',
  component: Chip,
  tags: ['autodocs'],
  argTypes: {
    active: { control: 'boolean' },
    accent: { control: 'select', options: ['ayce', 'express'] },
    as: { control: 'select', options: ['button', 'span'] },
  },
  render: args => ({
    components: { Chip },
    setup: () => ({ args }),
    template: '<Chip v-bind="args">Entradas</Chip>',
  }),
} satisfies Meta<typeof Chip>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { active: false, accent: 'ayce' } }
export const ActiveAyce: Story = { args: { active: true, accent: 'ayce' } }
export const ActiveExpress: Story = {
  args: { active: true, accent: 'express' },
}
export const AsSpan: Story = { args: { as: 'span', active: false } }

export const Group: Story = {
  args: { active: false },
  render: () => ({
    components: { Chip },
    template: `
      <div class="flex flex-wrap gap-3 p-6">
        <Chip active>Todos</Chip>
        <Chip>Entradas</Chip>
        <Chip>Burgers</Chip>
        <Chip>Postres</Chip>
        <Chip>Alitas</Chip>
      </div>`,
  }),
}

export const Mobile: Story = {
  args: { active: false },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { active: false },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
