import type { Meta, StoryObj } from '@storybook/vue3-vite'
import SiteMarquee from './SiteMarquee.vue'

/**
 * Global full-bleed dark marquee band shown directly below the nav. Phrases come
 * from the i18n `marquee` array (ES/EN, editable) and are separated by an orange
 * star. Honors reduced-motion via the underlying UiMarquee.
 */
const meta = {
  title: 'Layout/SiteMarquee',
  component: SiteMarquee,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen', backgrounds: { default: 'cream' } },
  argTypes: {},
} satisfies Meta<typeof SiteMarquee>

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
