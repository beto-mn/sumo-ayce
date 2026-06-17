import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Input from './Input.vue'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'tel', 'number', 'password'],
    },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: args => ({
    components: { Input },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `
      <div class="max-w-md p-6">
        <Input v-bind="args" v-model="value" />
      </div>`,
  }),
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { name: 'name', placeholder: 'Tu nombre', modelValue: '' },
}

export const WithLabelAndHint: Story = {
  args: {
    name: 'email',
    type: 'email',
    label: 'Correo',
    hint: 'Nunca lo compartiremos.',
    placeholder: 'tu@correo.com',
    modelValue: '',
  },
}

export const Required: Story = {
  args: {
    name: 'phone',
    type: 'tel',
    label: 'WhatsApp',
    required: true,
    placeholder: '+52 55 0000 0000',
    modelValue: '',
  },
}

export const ErrorState: Story = {
  args: {
    name: 'phone',
    type: 'tel',
    label: 'WhatsApp',
    error: 'Formato inválido',
    modelValue: '5500',
  },
}

export const Disabled: Story = {
  args: {
    name: 'email',
    type: 'email',
    label: 'Correo',
    disabled: true,
    modelValue: 'lectura@solo.com',
  },
}

export const Password: Story = {
  args: {
    name: 'password',
    type: 'password',
    label: 'Contraseña',
    modelValue: '',
  },
}

export const Mobile: Story = {
  args: { name: 'name', label: 'Nombre', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { name: 'name', label: 'Nombre', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
