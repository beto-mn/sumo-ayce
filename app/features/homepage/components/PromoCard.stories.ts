import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import PromoCard from './PromoCard.vue'

const base: Promotion = {
  id: 'p1',
  badge: { es: '2x1', en: '2for1' },
  title: { es: 'Martes 2x1 en AYCE', en: 'Tuesday 2for1 on AYCE' },
  description: {
    es: 'Trae a un amigo y come sin límites.',
    en: 'Bring a friend and eat without limits.',
  },
  validity: { es: 'Solo martes', en: 'Tuesdays only' },
  color: 'orange',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-10T00:00:00Z',
  imageUrl: null,
}

const meta = {
  title: 'Homepage/PromoCard',
  component: PromoCard,
  tags: ['autodocs'],
} satisfies Meta<typeof PromoCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { promo: base },
}

/** Interactive: a flyer image is attached, so the card becomes a button that
 *  emits `open` (wired to a Lightbox by HomePromotions). */
export const WithFlyer: Story = {
  args: { promo: { ...base, imageUrl: '/hero-placeholder.svg' } },
}

/** Badge color is editor-controlled via `acf.color`; these stories exercise the
 *  full token set so the colored top-right badge is visible per color. */
export const OrangeBadge: Story = {
  args: { promo: { ...base, color: 'orange' } },
}

export const PinkBadge: Story = {
  args: {
    promo: {
      ...base,
      badge: { es: 'Cumpleaños', en: 'Birthday' },
      color: 'pink',
    },
  },
}

export const BlueBadge: Story = {
  args: {
    promo: { ...base, badge: { es: 'Express', en: 'Express' }, color: 'blue' },
  },
}

export const GreenBadge: Story = {
  args: {
    promo: { ...base, badge: { es: 'Niños', en: 'Kids' }, color: 'green' },
  },
}

export const YellowBadge: Story = {
  args: {
    promo: { ...base, badge: { es: 'Martes', en: 'Tuesday' }, color: 'yellow' },
  },
}

/** Type-indicator bar (acf.tipo), separate from the badge color. AYCE shows a
 *  small orange bar above the title. */
export const AyceTypeBar: Story = {
  args: { promo: { ...base, type: 'ayce' } },
}

/** Express promotions show a small blue type bar above the title. */
export const ExpressTypeBar: Story = {
  args: {
    promo: {
      ...base,
      badge: { es: 'Express', en: 'Express' },
      type: 'express',
    },
  },
}

/** `all` promotions show a neutral ink type bar (applies to every line). */
export const AllTypeBar: Story = {
  args: { promo: { ...base, type: 'all' } },
}

export const LongText: Story = {
  args: {
    promo: {
      ...base,
      title: {
        es: 'Promoción de muy largo título que debe ajustarse dentro de la tarjeta',
        en: 'A very long promotion title that must wrap within the card boundary',
      },
    },
  },
}

export const MissingEnglish: Story = {
  args: {
    promo: {
      ...base,
      title: { es: 'Solo en español', en: '' },
      description: { es: 'Descripción solo en español.', en: '' },
    },
  },
  parameters: { i18n: 'en' },
}

export const Mobile: Story = {
  args: { promo: base },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
