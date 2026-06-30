import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SiteHeader from './SiteHeader.vue'

/**
 * Global public navigation. The logo is a token-built placeholder (no real SUMO
 * logo asset exists in the repo). The EN toggle and Reservar button are wired to
 * the i18n locale switch and the reservation open-intent in the live app; in
 * Storybook these are shimmed no-ops.
 */
const meta = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {},
} satisfies Meta<typeof SiteHeader>

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
