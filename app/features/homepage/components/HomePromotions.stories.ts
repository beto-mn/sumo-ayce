import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import HomePromotions from './HomePromotions.vue'

function promo(id: string, overrides: Partial<Promotion> = {}): Promotion {
  return {
    id,
    badge: { es: '2x1', en: '2for1' },
    title: `Promo ${id}`,
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageDesktopUrl: `https://placehold.co/1200x675/F37021/ffffff?text=Promo+${id}`,
    imageTabletUrl: `https://placehold.co/880x880/E85A9B/ffffff?text=Promo+${id}`,
    imageMovilUrl: `https://placehold.co/520x650/F5C518/1A1209?text=Promo+${id}`,
    ...overrides,
  }
}

const meta = {
  title: 'Homepage/HomePromotions',
  component: HomePromotions,
  tags: ['autodocs'],
  argTypes: {
    promotions: {
      description:
        'ALL active promotions rendered by the shared full-bleed carousel in the homepage promotions section (newest-first, no cap — one promo image per slide).',
      control: { type: 'object' },
      table: { category: 'Content' },
    },
  },
  args: {
    promotions: [
      promo('1', { color: 'orange' }),
      promo('2', { color: 'pink' }),
      promo('3', { color: 'yellow' }),
      promo('4', { color: 'green' }),
      promo('5', { color: 'blue' }),
    ],
  },
} satisfies Meta<typeof HomePromotions>

export default meta
type Story = StoryObj<typeof meta>

export const AllActivePromotions: Story = {
  name: 'All active promotions (full-bleed carousel)',
}

export const SinglePromotion: Story = {
  name: 'Single promotion (no nav)',
  args: { promotions: [promo('1')] },
}

export const WithExpress: Story = {
  name: 'With Express slide',
  args: {
    promotions: [
      promo('1', { color: 'orange' }),
      promo('2', { type: 'express', color: 'blue' }),
    ],
  },
}

export const Empty: Story = {
  name: 'Empty (section hidden)',
  args: { promotions: [] },
}

export const MobileViewport: Story = {
  name: 'Mobile viewport',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
