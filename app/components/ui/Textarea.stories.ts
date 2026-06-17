import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Textarea from './Textarea.vue'

const meta = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    rows: { control: { type: 'number', min: 2, max: 12, step: 1 } },
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
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

export const Mobile: Story = {
  args: { name: 'message', label: 'Mensaje', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { name: 'message', label: 'Mensaje', modelValue: '' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
