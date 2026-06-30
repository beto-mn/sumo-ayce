import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { Promotion } from '@/types/content'
import PromotionCard from './PromotionCard.vue'

const AYCE_PROMO: Promotion = {
  id: '1',
  badge: { es: 'Martes', en: 'Tuesday' },
  title: { es: 'Martes 2x1', en: 'Tuesday 2for1' },
  description: {
    es: 'Trae a un amigo y el segundo paga solo la mitad.',
    en: 'Bring a friend and the second pays half price.',
  },
  validity: { es: 'Solo martes', en: 'Tuesdays only' },
  color: 'orange',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-01T00:00:00Z',
  imageUrl: 'https://cms.sumo.com.mx/wp-content/uploads/martes-2x1.jpg',
}

const EXPRESS_PROMO: Promotion = {
  id: '2',
  badge: { es: 'Express', en: 'Express' },
  title: { es: 'SUMO Express', en: 'SUMO Express' },
  description: {
    es: 'All You Can Eat en formato compacto.',
    en: 'All You Can Eat in a compact format.',
  },
  validity: { es: 'Todos los días', en: 'Every day' },
  color: 'blue',
  type: 'express',
  active: true,
  publishedAt: '2026-06-02T00:00:00Z',
  imageUrl: 'https://cms.sumo.com.mx/wp-content/uploads/express.jpg',
}

const ALL_PROMO: Promotion = {
  id: '3',
  badge: { es: 'Sport Box', en: 'Sport Box' },
  title: { es: 'Sumo Sport Box', en: 'Sumo Sport Box' },
  description: {
    es: 'Válido en AYCE y Express. Disfruta tu partido favorito.',
    en: 'Valid at AYCE and Express. Enjoy your favorite match.',
  },
  validity: { es: 'Fines de semana', en: 'Weekends' },
  color: 'blue',
  type: 'all',
  active: true,
  publishedAt: '2026-06-03T00:00:00Z',
  imageUrl: 'https://cms.sumo.com.mx/wp-content/uploads/sport-box.jpg',
}

const NO_IMAGE_PROMO: Promotion = {
  ...AYCE_PROMO,
  id: '4',
  imageUrl: null,
}

const LONG_TEXT_PROMO: Promotion = {
  id: '5',
  badge: { es: 'Cumpleañeros', en: 'Birthday' },
  title: {
    es: 'Celebra tu cumpleaños con All You Can Eat gratis',
    en: 'Celebrate your birthday with free All You Can Eat',
  },
  description: {
    es: 'Presenta tu identificación oficial vigente el día de tu cumpleaños y disfruta tu AYCE sin costo. Válido solo en sucursales participantes.',
    en: 'Present your valid official ID on your birthday and enjoy your AYCE for free. Valid only at participating locations.',
  },
  validity: {
    es: 'El día de tu cumpleaños. Debe presentar identificación oficial.',
    en: 'On your birthday only. Must present official ID.',
  },
  color: 'pink',
  type: 'ayce',
  active: true,
  publishedAt: '2026-06-04T00:00:00Z',
  imageUrl: 'https://cms.sumo.com.mx/wp-content/uploads/cumple.jpg',
}

const meta = {
  title: 'Promotions/PromotionCard',
  component: PromotionCard,
  tags: ['autodocs'],
  argTypes: {
    promotion: {
      description:
        'Full Promotion object including badge, title, description, validity, color, type, and optional imageUrl',
      control: { type: 'object' },
    },
  },
} satisfies Meta<typeof PromotionCard>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  name: 'Default (AYCE, with image)',
  args: { promotion: AYCE_PROMO },
}

export const Express: Story = {
  name: 'Express (blue accent)',
  args: { promotion: EXPRESS_PROMO },
}

export const AllType: Story = {
  name: 'All type (ink indicator)',
  args: { promotion: ALL_PROMO },
}

export const NoImage: Story = {
  name: 'No image (non-interactive)',
  args: { promotion: NO_IMAGE_PROMO },
}

export const LongText: Story = {
  name: 'Long title & description',
  args: { promotion: LONG_TEXT_PROMO },
}

export const Mobile: Story = {
  args: { promotion: AYCE_PROMO },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { promotion: AYCE_PROMO },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  args: { promotion: AYCE_PROMO },
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  args: { promotion: AYCE_PROMO },
  parameters: { globals: { locale: 'en' } },
}

export const MobileNarrow: Story = {
  name: 'Narrow (360px)',
  args: { promotion: LONG_TEXT_PROMO },
  parameters: {
    viewport: {
      viewports: {
        narrow: {
          name: 'Narrow 360px',
          styles: { width: '360px', height: '800px' },
        },
      },
      defaultViewport: 'narrow',
    },
  },
}
