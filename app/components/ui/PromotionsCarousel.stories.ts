import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import PromotionsCarousel from './PromotionsCarousel.vue'

const COLORS: Promotion['color'][] = [
  'orange',
  'pink',
  'blue',
  'yellow',
  'green',
]

function promo(id: string, overrides: Partial<Promotion> = {}): Promotion {
  const color = COLORS[Number(id) % COLORS.length] ?? 'orange'
  return {
    id,
    badge: { es: `Promo ${id}`, en: `Promo ${id}` },
    title: `Promoción ${id}`,
    color,
    type: 'ayce',
    active: true,
    publishedAt: `2026-06-0${id}T00:00:00Z`,
    imageDesktopUrl: `https://placehold.co/1200x675/F37021/ffffff?text=Promo+${id}`,
    imageTabletUrl: `https://placehold.co/880x880/E85A9B/ffffff?text=Promo+${id}`,
    imageMovilUrl: `https://placehold.co/520x650/F5C518/1A1209?text=Promo+${id}`,
    terms: null,
    ...overrides,
  }
}

const meta = {
  title: 'Promotions/PromotionsCarousel',
  component: PromotionsCarousel,
  tags: ['autodocs'],
  argTypes: {
    promotions: {
      description:
        "Promotion slides — ONE full-bleed promo image per view at every breakpoint. Embla enables touch/drag; dots and prev/next arrows appear only with more than one slide. The nav (arrows + active dot) is color-coded by the ACTIVE slide's type: AYCE=orange, Express=blue, Ambos=orange→blue. Respects prefers-reduced-motion (no auto-advance motion). A card with a bilingual `terms` pair can be clicked/tapped to flip and reveal its Terms & Conditions; only one card is ever flipped at a time, and navigating (drag/arrows/dots) resets it.",
      control: { type: 'object' },
      table: { category: 'Content' },
    },
  },
  args: { promotions: [promo('1'), promo('2'), promo('3'), promo('4')] },
} satisfies Meta<typeof PromotionsCarousel>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (one full-bleed slide per promo)',
}

export const SingleSlide: Story = {
  name: 'Single slide (dots/arrows hidden)',
  args: { promotions: [promo('1')] },
}

export const WithExpress: Story = {
  name: 'With an Express slide',
  args: {
    promotions: [
      promo('1'),
      promo('2', {
        type: 'express',
        color: 'blue',
        badge: { es: 'Express', en: 'Express' },
      }),
      promo('3'),
    ],
  },
}

export const NavAyce: Story = {
  name: 'Nav color: AYCE active (orange)',
  args: {
    promotions: [
      promo('1', { type: 'ayce' }),
      promo('2', { type: 'express', color: 'blue' }),
    ],
  },
}

export const NavExpress: Story = {
  name: 'Nav color: Express active (blue)',
  args: {
    promotions: [
      promo('1', { type: 'express', color: 'blue' }),
      promo('2', { type: 'ayce' }),
    ],
  },
}

export const NavAll: Story = {
  name: 'Nav color: Ambos active (orange→blue)',
  args: {
    promotions: [
      promo('1', { type: 'all', color: 'yellow' }),
      promo('2', { type: 'ayce' }),
    ],
  },
}

export const MobileViewport: Story = {
  name: 'Mobile viewport (full-bleed, 1 per view)',
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const DesktopViewport: Story = {
  name: 'Desktop viewport (full-bleed, 1 per view)',
  parameters: { viewport: { defaultViewport: 'desktop' } },
}

/**
 * The first slide carries Terms & Conditions in BOTH languages — click/tap
 * it to see it flip and reveal the back face. Navigating away (arrows/dots)
 * resets it to the front face (FR-004).
 */
export const WithFlippableTerms: Story = {
  name: 'Flippable slide (click to reveal Terms & Conditions)',
  args: {
    promotions: [
      promo('1', {
        terms: {
          es: 'Válido de lunes a jueves, no acumulable con otras promociones.',
          en: 'Valid Monday through Thursday, not combinable with other promotions.',
        },
      }),
      promo('2'),
      promo('3'),
    ],
  },
}
