import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Review } from '@/types/content'
import ReviewCard from './ReviewCard.vue'

const base: Review = {
  id: 'r1',
  authorName: 'Mariana López',
  rating: 5,
  text: {
    es: 'El mejor All You Can Eat de la ciudad.',
    en: 'The best All You Can Eat in town.',
  },
  source: 'google',
  reviewedAt: '2026-05-12',
}

const meta = {
  title: 'Homepage/ReviewCard',
  component: ReviewCard,
  tags: ['autodocs'],
} satisfies Meta<typeof ReviewCard>

export default meta
type Story = StoryObj<typeof meta>

export const FiveStars: Story = {
  args: { review: base },
}

export const FourStars: Story = {
  args: { review: { ...base, rating: 4 } },
}

export const OneStar: Story = {
  args: { review: { ...base, rating: 1, authorName: 'Anónimo' } },
}

export const Mobile: Story = {
  args: { review: base },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
