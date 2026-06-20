import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { ref } from 'vue'
import Lightbox from './Lightbox.vue'

const SAMPLE_SRC = '/hero-placeholder.svg'

const meta = {
  title: 'UI/Lightbox',
  component: Lightbox,
  tags: ['autodocs'],
  argTypes: {
    open: { control: 'boolean' },
    src: { control: 'text' },
    alt: { control: 'text' },
  },
} satisfies Meta<typeof Lightbox>

export default meta
type Story = StoryObj<typeof meta>

/** Closed by default; a trigger toggles the overlay open. */
export const Default: Story = {
  args: { open: false, src: SAMPLE_SRC, alt: 'Promo flyer' },
  render: args => ({
    components: { Lightbox },
    setup() {
      const open = ref(false)
      return { args, open }
    },
    template: `
      <div class="p-6">
        <button
          type="button"
          class="rounded-pop-full border-pop border-ink bg-accent px-4 py-2 font-disp font-extrabold uppercase text-bg shadow-pop"
          @click="open = true"
        >
          Ver promoción
        </button>
        <Lightbox :open="open" :src="args.src" :alt="args.alt" @close="open = false" />
      </div>`,
  }),
}

/** Forced-open state showing the image large in the overlay. */
export const Open: Story = {
  args: { open: true, src: SAMPLE_SRC, alt: 'Promo flyer' },
}

/** No source: the component renders nothing even when open. */
export const NoSource: Story = {
  args: { open: true, src: null, alt: '' },
}

export const Mobile: Story = {
  args: { open: true, src: SAMPLE_SRC, alt: 'Promo flyer' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { open: true, src: SAMPLE_SRC, alt: 'Promo flyer' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
