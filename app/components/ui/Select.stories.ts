import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Select from './Select.vue'

const branchOptions = [
  { value: 'centro', label: 'Centro' },
  { value: 'polanco', label: 'Polanco' },
  { value: 'roma', label: 'Roma Norte' },
  { value: 'condesa', label: 'Condesa' },
]

const meta = {
  title: 'UI/Select',
  component: Select,
  tags: ['autodocs'],
  argTypes: {
    required: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
  render: args => ({
    components: { Select },
    setup() {
      const value = ref('')
      return { args, value }
    },
    template: `
      <div class="max-w-md p-6">
        <Select v-bind="args" v-model="value" />
      </div>`,
  }),
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    options: branchOptions,
    placeholder: 'Select',
    modelValue: '',
  },
}

export const Required: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    required: true,
    options: branchOptions,
    placeholder: 'Select',
    modelValue: '',
  },
}

export const WithHint: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    hint: 'Only open branches today.',
    options: branchOptions,
    modelValue: 'centro',
  },
}

export const ErrorState: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    error: 'Please select a branch',
    options: branchOptions,
    modelValue: '',
  },
}

export const Disabled: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    disabled: true,
    options: branchOptions,
    modelValue: 'polanco',
  },
}

export const Mobile: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    options: branchOptions,
    modelValue: '',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    name: 'branch',
    label: 'Branch',
    options: branchOptions,
    modelValue: '',
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
