import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Textarea from './Textarea.vue'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    label: {
      description: 'Visible label displayed above the textarea',
      control: { type: 'text' },
    },
    placeholder: {
      description: 'Placeholder text shown when the textarea is empty',
      control: { type: 'text' },
    },
    modelValue: {
      description: 'Bound value via v-model',
      control: { type: 'text' },
    },
    error: {
      description: 'Validation error message displayed below the textarea',
      control: { type: 'text' },
    },
    rows: {
      description: 'Number of visible text lines',
      control: { type: 'number', min: 2, max: 12, step: 1 },
    },
    required: {
      description: 'Marks the field as required',
      control: { type: 'boolean' },
    },
    disabled: {
      description: 'Disables the textarea, preventing interaction',
      control: { type: 'boolean' },
    },
  },
  render: args => ({
    components: { Textarea },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `
      <div class="max-w-lg p-6">
        <Textarea v-bind="args" v-model="value" />
      </div>`,
  }),
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { name: 'message', placeholder: '¿Cómo te ayudamos?', modelValue: '' },
}

export const WithLabelAndHint: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    hint: 'Cuéntanos los detalles de tu reservación.',
    placeholder: 'Ej. mesa cerca de la ventana',
    modelValue: '',
  },
}

export const Required: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    required: true,
    modelValue: '',
  },
}

export const ErrorState: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    error: 'No puede quedar vacío',
    modelValue: '',
  },
}

export const Disabled: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    disabled: true,
    modelValue: 'Reservación confirmada.',
  },
}

export const TallRows: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    rows: 8,
    modelValue: '',
  },
}

export const LocaleES: Story = {
  args: {
    name: 'message',
    label: 'Mensaje',
    placeholder: '¿Cómo te ayudamos?',
    modelValue: '',
  },
}

export const LocaleEN: Story = {
  args: {
    name: 'message',
    label: 'Message',
    placeholder: 'How can we help you?',
    modelValue: '',
  },
}

export const Mobile: Story = {
  args: { name: 'message', label: 'Mensaje', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { name: 'message', label: 'Mensaje', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
