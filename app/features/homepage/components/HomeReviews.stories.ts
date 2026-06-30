import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { REVIEWS } from '../data/reviews'
import HomeReviews from './HomeReviews.vue'

const meta = {
  title: 'Homepage/HomeReviews',
  component: HomeReviews,
  tags: ['autodocs'],
  argTypes: {
    reviews: {
      description:
        'Array of Review objects to display in the homepage reviews section',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof HomeReviews>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { reviews: REVIEWS },
}

export const Empty: Story = {
  args: { reviews: [] },
}

export const Mobile: Story = {
  args: { reviews: REVIEWS },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { reviews: REVIEWS },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
