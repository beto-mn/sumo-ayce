import type { Meta, StoryObj } from '@storybook/vue3-vite'
import ContactInfo from './ContactInfo.vue'

const meta = {
  title: 'Contact/ContactInfo',
  component: ContactInfo,
  tags: ['autodocs'],
  argTypes: {
    selectedBranch: { control: 'object' },
    name: { control: 'text' },
    message: { control: 'text' },
  },
} satisfies Meta<typeof ContactInfo>

export default meta
type Story = StoryObj<typeof meta>

export const NoBranchSelected: Story = {
  name: 'No branch selected (prompt visible)',
  args: {
    selectedBranch: null,
    name: '',
    message: '',
  },
}

export const BranchSelected: Story = {
  name: 'Branch selected (WhatsApp pill visible)',
  args: {
    selectedBranch: { id: 'b1', name: 'SUMO Polanco', phone: '5215512345678' },
    name: '',
    message: '',
  },
}

export const WithFormData: Story = {
  name: 'With form data (mailto pre-filled)',
  args: {
    selectedBranch: { id: 'b1', name: 'SUMO Polanco', phone: '5215512345678' },
    name: 'Ana García',
    message: 'Hola, quisiera reservar una mesa para 4 personas este sábado.',
  },
}

export const Mobile: Story = {
  args: {
    selectedBranch: null,
    name: '',
    message: '',
  },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: {
    selectedBranch: { id: 'b1', name: 'SUMO Polanco', phone: '5215512345678' },
    name: 'Ana García',
    message: 'Hola, quisiera reservar.',
  },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
