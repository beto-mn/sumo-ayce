import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PageHeader from './PageHeader.vue'

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  args: { badge: 'Promociones', title: 'Promociones' },
  argTypes: {
    title: {
      description: 'Main heading text displayed on the page header',
      control: { type: 'text' },
    },
    badge: {
      description: 'Kicker badge text shown above the title',
      control: { type: 'text' },
    },
    badgeTone: {
      description: 'Color tone for the kicker badge',
      control: { type: 'select' },
      options: ['ink', 'accent', 'orange', 'pink', 'blue', 'yellow'],
    },
    subtitle: {
      description: 'Optional subtitle text displayed below the title',
      control: { type: 'text' },
    },
  },
}
export default meta
type Story = StoryObj<typeof PageHeader>

export const Default: Story = {}

export const Pink: Story = {
  args: { badge: 'Promociones', badgeTone: 'pink', title: 'Promociones' },
}

export const WithSubtitle: Story = {
  args: {
    badge: 'Sucursales',
    badgeTone: 'ink',
    title: 'Encuentra tu SUMO',
    subtitle: 'Encuentra la sucursal más cercana o reserva sin filas.',
  },
}

export const Blue: Story = {
  args: { badge: 'Menú', badgeTone: 'blue', title: 'Nuestro Menú' },
}

export const LocaleES: Story = {
  args: {
    badge: 'Promociones',
    badgeTone: 'pink',
    title: 'Promociones',
    subtitle: 'Descuentos y ofertas exclusivas para ti.',
  },
}

export const LocaleEN: Story = {
  args: {
    badge: 'Promotions',
    badgeTone: 'pink',
    title: 'Promotions',
    subtitle: 'Exclusive discounts and offers for you.',
  },
}
