import type { Meta, StoryObj } from '@storybook/vue3-vite'
import LoginForm from './LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Staff/LoginForm',
  component: LoginForm,
  tags: ['autodocs'],
  parameters: {
    backgrounds: { default: 'dark' },
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
