import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import HomePromotions from './HomePromotions.vue'

function promo(id: string, overrides: Partial<Promotion> = {}): Promotion {
  return {
    id,
    badge: { es: '2x1', en: '2for1' },
    title: { es: `Promo ${id}`, en: `Promo ${id}` },
    description: {
      es: 'Come sin límites y ahorra.',
      en: 'Eat without limits and save.',
    },
    validity: { es: 'Junio 2026', en: 'June 2026' },
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageUrl: null,
    ...overrides,
  }
}

const meta = {
  title: 'Homepage/HomePromotions',
  component: HomePromotions,
  tags: ['autodocs'],
} satisfies Meta<typeof HomePromotions>

export default meta
type Story = StoryObj<typeof meta>

export const ThreePromotions: Story = {
  args: {
    promotions: [
      promo('1', { color: 'orange' }),
      promo('2', { color: 'pink' }),
      promo('3', { color: 'yellow' }),
    ],
  },
}

export const FewerThanThree: Story = {
  args: { promotions: [promo('1')] },
}

export const WithExpress: Story = {
  args: {
    promotions: [
      promo('1', { color: 'orange' }),
      promo('2', { type: 'express', color: 'blue' }),
    ],
  },
}

export const Empty: Story = {
  args: { promotions: [] },
}

export const Mobile: Story = {
  args: { promotions: [promo('1'), promo('2'), promo('3')] },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
