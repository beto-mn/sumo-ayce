import type { Meta, StoryObj } from '@storybook/vue3-vite'

/**
 * Reservation feature slice — overview index.
 *
 * Documents the components that compose the reservation flow. Each component
 * has its own dedicated stories under `Reservation/*`; this Docs entry is a
 * navigable summary of the slice.
 */
const meta: Meta = {
  title: 'Features/Reservation',
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj

export const Overview: Story = {
  render: () => ({
    template: `
      <div style="font-family: sans-serif; padding: 2rem; max-width: 640px;">
        <h1>Reservation Feature</h1>
        <p>Components in this slice:</p>
        <ul>
          <li><strong>ReservationForm</strong> — full reservation form composing the field groups and submit flow.</li>
          <li><strong>ReservationFieldsPrimary</strong> — branch + type fields.</li>
          <li><strong>ReservationFieldsDateTime</strong> — date + time slot picker.</li>
          <li><strong>ReservationFieldsContact</strong> — name + phone fields.</li>
          <li><strong>ReservationConfirmation</strong> — success state shown after submission.</li>
        </ul>
      </div>
    `,
  }),
}
