import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LoginForm from './LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Staff/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
  },
  argTypes: {
    error: {
      description: 'Error message to display below the form (login failure)',
      control: { type: 'text' },
    },
    loading: {
      description: 'Shows a loading state and disables the submit button',
      control: { type: 'boolean' },
    },
  },
}

export default meta
type Story = StoryObj<typeof LoginForm>

export const Default: Story = {}

export const Loading: Story = {
  args: { loading: true },
}

export const WithError: Story = {
  args: { error: 'Credenciales inválidas' },
}

export const Responsive: Story = {
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
  },
}
