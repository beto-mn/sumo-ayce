import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import ContactForm from './ContactForm.vue'

const meta = {
  title: 'Contact/ContactForm',
  component: ContactForm,
  tags: ['autodocs'],
} satisfies Meta<typeof ContactForm>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (branches loaded, fields empty)',
}

export const Loading: Story = {
  name: 'Loading (fetching branches)',
  decorators: [
    () => ({
      setup() {
        return {}
      },
      template: '<story />',
    }),
  ],
}

export const ErrorState: Story = {
  name: 'Error (fetch failed)',
}

export const EmptyBranches: Story = {
  name: 'Empty branches (no phone numbers)',
}

export const AllFieldsFilled: Story = {
  name: 'All fields filled (CTA enabled)',
  render: () => ({
    components: { ContactForm },
    setup() {
      const selectedBranch = ref(null)
      return { selectedBranch }
    },
    template: `<ContactForm @update:selected-branch="selectedBranch = $event" />`,
  }),
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
