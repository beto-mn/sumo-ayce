import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from './Button.vue'
import Chip from './Chip.vue'
import Nav from './Nav.vue'

const meta = {
  title: 'UI/Nav',
  component: Nav,
  tags: ['autodocs'],
  argTypes: {
    accent: { control: 'select', options: ['ayce', 'express'] },
    sticky: { control: 'boolean' },
  },
  render: args => ({
    components: { Nav, Chip, Button },
    setup: () => ({ args }),
    template: `
      <Nav v-bind="args">
        <template #links>
          <Chip :active="true">Menú</Chip>
          <Chip>Promociones</Chip>
          <Chip>Sucursales</Chip>
          <Chip>Lealtad</Chip>
          <Chip>Contacto</Chip>
        </template>
        <template #actions>
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-pop-sm border-pop border-ink bg-yellow text-ink shadow-pop-sm font-disp font-extrabold"
          >EN</button>
          <Button size="sm">Reservar</Button>
        </template>
      </Nav>`,
  }),
} satisfies Meta<typeof Nav>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { accent: 'ayce', sticky: true } }

export const ExpressAccent: Story = {
  args: { accent: 'express', sticky: true },
}

export const NotSticky: Story = { args: { accent: 'ayce', sticky: false } }

export const Mobile: Story = {
  args: { accent: 'ayce', sticky: true },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { accent: 'ayce', sticky: true },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
