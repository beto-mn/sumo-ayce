import type { Meta, StoryObj } from '@storybook/vue3-vite'
import PageHeader from './PageHeader.vue'

const meta: Meta<typeof PageHeader> = {
  title: 'UI/PageHeader',
  component: PageHeader,
  args: { badge: 'Promociones', title: 'Promociones' },
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
