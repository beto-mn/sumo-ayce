import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SiteFooter from './SiteFooter.vue'

/**
 * Global public site footer. Structured Brand / Navegación / Síguenos /
 * Contacto columns over a Mercado Pop cream band. Síguenos links out to the
 * official SUMO social profiles; Contacto links internally to the contact
 * page. In Storybook the i18n and localePath are shimmed no-ops.
 */
const meta = {
  title: 'Layout/SiteFooter',
  component: SiteFooter,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: { year: 2026 },
  argTypes: {
    year: {
      description: 'Copyright year displayed in the footer',
      control: { type: 'number' },
    },
  },
} satisfies Meta<typeof SiteFooter>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const LocaleES: Story = {
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
