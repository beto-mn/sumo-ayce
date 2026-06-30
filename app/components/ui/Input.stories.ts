import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Input from './Input.vue'

const meta = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    label: {
      description: 'Visible label displayed above the input',
      control: { type: 'text' },
    },
    placeholder: {
      description: 'Placeholder text shown when the input is empty',
      control: { type: 'text' },
    },
    modelValue: {
      description: 'Bound value via v-model',
      control: { type: 'text' },
    },
    error: {
      description: 'Validation error message displayed below the input',
      control: { type: 'text' },
    },
    type: {
      description: 'HTML input type attribute',
      control: { type: 'select' },
      options: ['text', 'email', 'tel', 'number', 'password'],
    },
    required: {
      description: 'Marks the field as required',
      control: { type: 'boolean' },
    },
    disabled: {
      description: 'Disables the input, preventing interaction',
      control: { type: 'boolean' },
    },
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

export const LocaleES: Story = {
  args: {
    name: 'name',
    label: 'Nombre completo',
    placeholder: 'Tu nombre',
    modelValue: '',
  },
}

export const LocaleEN: Story = {
  args: {
    name: 'name',
    label: 'Full name',
    placeholder: 'Your name',
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
