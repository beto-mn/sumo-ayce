import type { Meta, StoryObj } from '@storybook/vue3-vite'
import VisitButton from './VisitButton.vue'

const meta: Meta<typeof VisitButton> = {
  title: 'Staff/VisitButton',
  component: VisitButton,
  tags: ['autodocs'],
  parameters: { backgrounds: { default: 'dark' } },
  argTypes: {
    state: {
      description: 'Current interaction state of the button',
      control: { type: 'select' },
      options: ['idle', 'loading', 'success', 'error'],
    },
    errorMessage: {
      description: 'Error message displayed when state is "error"',
      control: { type: 'text' },
    },
  },
}

export default meta
type Story = StoryObj<typeof VisitButton>

export const Default: Story = {}

export const Loading: Story = {
  args: { state: 'loading' },
}

export const Success: Story = {
  args: { state: 'success' },
}

export const WithError: Story = {
  args: { state: 'error', errorMessage: 'El cliente ya acumuló puntos hoy' },
}

export const Responsive: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
