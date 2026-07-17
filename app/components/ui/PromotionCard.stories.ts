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
    terms: null,
    ...overrides,
  }
}

/** Bilingual Terms & Conditions used by the `Flipped`/`NoTerms` stories below. */
const TERMS = {
  es: 'Válido de lunes a jueves, no acumulable con otras promociones. Aplica solo en sucursales participantes.',
  en: 'Valid Monday through Thursday, not combinable with other promotions. Applies only at participating branches.',
}

const meta = {
  title: 'Promotions/PromotionCard',
  component: PromotionCard,
  tags: ['autodocs'],
  argTypes: {
    promotion: {
      description:
        'Promotion object: badge (bilingual), decoded title, color, type, the three responsive image URLs (desktop/tablet/mobile), and an optional bilingual `terms` pair. The promo IMAGE is the full-bleed slide — no card frame. Two overlays: a labeled TYPE pill top-left (AYCE=orange, Express=blue, Ambos=orange→blue) and the WP color/day badge top-right.',
      control: { type: 'object' },
      table: { category: 'Content' },
    },
    flipped: {
      description:
        'Whether the card currently shows its back face (Terms & Conditions). Owned by the parent carousel — offered as a clickable affordance only when `promotion.terms` is non-null (bilingual-completeness rule).',
      control: { type: 'boolean' },
      table: { category: 'Behavior' },
    },
  },
  args: { promotion: promo(), flipped: false },
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

// ── Flip-to-terms (Part A) ──────────────────────────────────────────────────

/**
 * Both `tyc_es`/`tyc_en` are present — the card offers the flip affordance
 * (cursor-pointer, aria-label) and, with `flipped: true`, shows its back
 * face with the Terms & Conditions text.
 */
export const Flipped: Story = {
  name: 'Flipped (Terms & Conditions back face)',
  args: {
    promotion: promo({ terms: TERMS }),
    flipped: true,
  },
}

/** Same promo as `Flipped`, front face — click it to see the flip toggle live. */
export const Flippable: Story = {
  name: 'Flippable (click to flip)',
  args: {
    promotion: promo({ terms: TERMS }),
    flipped: false,
  },
}

/**
 * No Terms & Conditions configured (or only ONE language filled in — both
 * cases resolve to `terms: null` upstream, per the bilingual-completeness
 * rule) — the card offers NO flip affordance at all: no cursor-pointer, no
 * aria-label, clicking it does nothing.
 */
export const NoTerms: Story = {
  name: 'No terms (no flip affordance)',
  args: {
    promotion: promo({ terms: null }),
    flipped: false,
  },
}
