import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import PromotionsGrid from './PromotionsGrid.vue'

const makePromo = (
  id: string,
  overrides: Partial<Promotion> = {}
): Promotion => ({
  id,
  badge: { es: 'Martes', en: 'Tuesday' },
  title: { es: `Promo ${id}`, en: `Promo ${id}` },
  description: {
    es: 'Descripción breve de la promoción.',
    en: 'Brief promo description.',
  },
  validity: { es: 'Solo este mes', en: 'This month only' },
  color: 'orange',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-01T00:00:00Z',
  imageUrl: `https://cms.sumo.com.mx/wp-content/uploads/promo-${id}.jpg`,
  ...overrides,
})

const SIX_PROMOS: Promotion[] = [
  makePromo('1', {
    badge: { es: 'Martes', en: 'Tuesday' },
    color: 'orange',
    type: 'ayce',
  }),
  makePromo('2', {
    badge: { es: 'Express', en: 'Express' },
    color: 'blue',
    type: 'express',
    title: { es: 'SUMO Express', en: 'SUMO Express' },
  }),
  makePromo('3', {
    badge: { es: 'Jueves', en: 'Thursday' },
    color: 'orange',
    type: 'ayce',
    imageUrl: null,
  }),
  makePromo('4', {
    badge: { es: 'Sport Box', en: 'Sport Box' },
    color: 'blue',
    type: 'all',
  }),
  makePromo('5', {
    badge: { es: 'Cumpleañeros', en: 'Birthday' },
    color: 'pink',
    type: 'ayce',
  }),
  makePromo('6', {
    badge: { es: 'Miércoles', en: 'Wednesday' },
    color: 'orange',
    type: 'all',
  }),
]

const meta = {
  title: 'Promotions/PromotionsGrid',
  component: PromotionsGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof PromotionsGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (6 promos)',
  args: { promotions: SIX_PROMOS, ok: true },
}

export const Empty: Story = {
  name: 'Empty state (0 promos)',
  args: { promotions: [], ok: true },
}

export const ErrorState: Story = {
  name: 'Error state (ok=false)',
  args: { promotions: SIX_PROMOS, ok: false },
}

export const SingleColumn: Story = {
  name: 'Single column (mobile 360px)',
  args: { promotions: SIX_PROMOS, ok: true },
  parameters: {
    viewport: {
      viewports: {
        narrow: { name: '360px', styles: { width: '360px', height: '900px' } },
      },
      defaultViewport: 'narrow',
    },
  },
}

export const TwoColumns: Story = {
  name: 'Two columns (tablet 520px)',
  args: { promotions: SIX_PROMOS, ok: true },
  parameters: {
    viewport: {
      viewports: {
        tablet: { name: '520px', styles: { width: '520px', height: '900px' } },
      },
      defaultViewport: 'tablet',
    },
  },
}

export const ThreeColumns: Story = {
  name: 'Three columns (desktop 880px+)',
  args: { promotions: SIX_PROMOS, ok: true },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
