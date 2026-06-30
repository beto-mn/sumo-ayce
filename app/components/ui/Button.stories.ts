import type { Meta, StoryObj } from '@storybook/vue3-vite'
import Button from './Button.vue'

const meta = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      description: 'Visual style of the button',
      control: { type: 'select' },
      options: ['primary', 'ink', 'ghost'],
    },
    size: {
      description: 'Size of the button',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    type: {
      description: 'HTML button type attribute',
      control: { type: 'select' },
      options: ['button', 'submit', 'reset'],
    },
    disabled: {
      description: 'Disables the button, preventing interaction',
      control: { type: 'boolean' },
    },
    loading: {
      description: 'Shows a loading spinner and disables the button',
      control: { type: 'boolean' },
    },
  },
  render: args => ({
    components: { Button },
    setup: () => ({ args }),
    template: '<Button v-bind="args">Reservar</Button>',
  }),
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = { args: { variant: 'primary', size: 'md' } }

export const PrimarySmall: Story = { args: { variant: 'primary', size: 'sm' } }
export const PrimaryLarge: Story = { args: { variant: 'primary', size: 'lg' } }

export const Ink: Story = { args: { variant: 'ink', size: 'md' } }
export const Ghost: Story = { args: { variant: 'ghost', size: 'md' } }

export const Disabled: Story = { args: { variant: 'primary', disabled: true } }
export const Loading: Story = { args: { variant: 'primary', loading: true } }

export const ExpressAccent: Story = {
  args: { variant: 'primary', size: 'md' },
  render: args => ({
    components: { Button },
    setup: () => ({ args }),
    template:
      '<div class="scope-express p-6"><Button v-bind="args">Express</Button></div>',
  }),
}

export const AllVariants: Story = {
  args: { variant: 'primary', size: 'md' },
  render: () => ({
    components: { Button },
    template: `
      <div class="flex flex-col gap-4 p-6">
        <div class="flex flex-wrap gap-3 items-center">
          <Button variant="primary" size="sm">Primary SM</Button>
          <Button variant="primary" size="md">Primary MD</Button>
          <Button variant="primary" size="lg">Primary LG</Button>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <Button variant="ink" size="sm">Ink SM</Button>
          <Button variant="ink" size="md">Ink MD</Button>
          <Button variant="ink" size="lg">Ink LG</Button>
        </div>
        <div class="flex flex-wrap gap-3 items-center">
          <Button variant="ghost" size="sm">Ghost SM</Button>
          <Button variant="ghost" size="md">Ghost MD</Button>
          <Button variant="ghost" size="lg">Ghost LG</Button>
        </div>
      </div>`,
  }),
}

export const Mobile: Story = {
  args: { variant: 'primary', size: 'md' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { variant: 'primary', size: 'md' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
