import type { Meta, StoryObj } from '@storybook/vue3-vite'
import UiSkeleton from './UiSkeleton.vue'

const meta = {
  title: 'UI/UiSkeleton',
  component: UiSkeleton,
  tags: ['autodocs'],
  args: { shape: 'rect' },
  argTypes: {
    shape: {
      description:
        'Visual shape of the placeholder. Sizing (width/height) is controlled by the consumer via `class` passthrough — this primitive has no size props.',
      control: { type: 'select' },
      options: ['rect', 'pill', 'circle'],
    },
  },
  render: args => ({
    components: { UiSkeleton },
    setup: () => ({ args }),
    template: '<UiSkeleton v-bind="args" class="h-10 w-24" />',
  }),
} satisfies Meta<typeof UiSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** Default rect placeholder, animated with Tailwind's `animate-pulse`. */
export const Default: Story = { args: { shape: 'rect' } }

export const Pill: Story = { args: { shape: 'pill' } }

export const Circle: Story = {
  args: { shape: 'circle' },
  render: args => ({
    components: { UiSkeleton },
    setup: () => ({ args }),
    template: '<UiSkeleton v-bind="args" class="h-12 w-12" />',
  }),
}

/**
 * Under `prefers-reduced-motion: reduce`, the `motion-reduce:animate-none`
 * class (always present, see UiSkeleton.spec.ts) disables the pulse — the
 * shape renders static. Emulate via your browser/OS "reduce motion" setting
 * or devtools' rendering panel to see this story hold still.
 */
export const ReducedMotion: Story = {
  args: { shape: 'rect' },
}

export const Mobile: Story = {
  args: { shape: 'rect' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  args: { shape: 'rect' },
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
