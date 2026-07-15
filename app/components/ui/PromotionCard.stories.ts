import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import PromotionCard from './PromotionCard.vue'

const DESKTOP = 'https://placehold.co/1200x675/F37021/ffffff?text=Desktop'
const TABLET = 'https://placehold.co/880x880/E85A9B/ffffff?text=Tablet'
const MOVIL = 'https://placehold.co/520x650/F5C518/1A1209?text=Mobile'

function promo(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: '1',
    badge: { es: 'Martes', en: 'Tuesday' },
    title: '2×1 en sushi',
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-01T00:00:00Z',
    imageDesktopUrl: DESKTOP,
    imageTabletUrl: TABLET,
    imageMovilUrl: MOVIL,
    ...overrides,
  }
}

const meta = {
  title: 'Promotions/PromotionCard',
  component: PromotionCard,
  tags: ['autodocs'],
  argTypes: {
    promotion: {
      description:
        'Promotion object: badge (bilingual), decoded title, color, type, and the three responsive image URLs (desktop/tablet/mobile). The promo IMAGE is the full-bleed slide — no card frame. Two overlays: a labeled TYPE pill top-left (AYCE=orange, Express=blue, Ambos=orange→blue) and the WP color/day badge top-right.',
      control: { type: 'object' },
      table: { category: 'Content' },
    },
  },
  args: { promotion: promo() },
} satisfies Meta<typeof PromotionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (AYCE, orange)',
}

/** AYCE promo → orange type pill (top-left) labeled "AYCE". */
export const TypeAyce: Story = {
  name: 'Type: AYCE (orange pill)',
  args: { promotion: promo({ type: 'ayce' }) },
}

/** Express promo → blue type pill (top-left) labeled "EXPRESS". */
export const TypeExpress: Story = {
  name: 'Type: Express (blue pill)',
  args: {
    promotion: promo({
      type: 'express',
      color: 'blue',
      badge: { es: 'Express', en: 'Express' },
    }),
  },
}

/** Ambos ('all') → two-tone orange→blue pill labeled "AYCE + EXPRESS". */
export const TypeAll: Story = {
  name: 'Type: Ambos (two-tone pill)',
  args: {
    promotion: promo({
      type: 'all',
      color: 'yellow',
      badge: { es: 'Todos', en: 'All' },
    }),
  },
}

export const Pink: Story = {
  name: 'Pink badge',
  args: {
    promotion: promo({
      color: 'pink',
      badge: { es: 'Cumple', en: 'Birthday' },
    }),
  },
}

export const Blue: Story = {
  name: 'Blue badge',
  args: { promotion: promo({ color: 'blue' }) },
}

export const Yellow: Story = {
  name: 'Yellow badge',
  args: { promotion: promo({ color: 'yellow' }) },
}

export const Green: Story = {
  name: 'Green badge',
  args: { promotion: promo({ color: 'green' }) },
}

export const Express: Story = {
  name: 'Express (blue scope)',
  args: {
    promotion: promo({
      type: 'express',
      color: 'blue',
      badge: { es: 'Express', en: 'Express' },
    }),
  },
}

export const MissingResponsiveImages: Story = {
  name: 'Missing tablet/mobile (desktop fallback)',
  args: { promotion: promo({ imageTabletUrl: null, imageMovilUrl: null }) },
}

export const NoImage: Story = {
  name: 'No image (placeholder, not broken)',
  args: {
    promotion: promo({
      imageDesktopUrl: null,
      imageTabletUrl: null,
      imageMovilUrl: null,
    }),
  },
}

export const EmptyTitle: Story = {
  name: 'Empty title (generic alt)',
  args: { promotion: promo({ title: '' }) },
}

export const MobileViewport: Story = {
  name: 'Mobile viewport',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const DesktopViewport: Story = {
  name: 'Desktop viewport',
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
