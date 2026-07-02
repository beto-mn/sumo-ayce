import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Contact feature slice — overview index.
 *
 * Documents the components that make up the contact page. Each component has
 * its own dedicated stories under `Contact/*`; this Docs entry is a navigable
 * summary of the slice.
 */
const meta: Meta = {
  title: 'Features/Contact',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Contact Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>ContactForm</strong> — message form with branch selector, validation and error state.</li>
          <li><strong>ContactInfo</strong> — static contact details block (address, phone, hours, socials).</li>
        </ul>
      </div>
    `,
  }),
}
