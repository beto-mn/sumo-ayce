import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuSkeleton from './MenuSkeleton.vue'

const meta = {
  title: 'Menu/MenuSkeleton',
  component: MenuSkeleton,
  tags: ['autodocs'],
  args: { selection: 'ayce', modality: 'buffet' },
  argTypes: {
    selection: {
      description:
        'Destination primary selection (already known from route.query before the fetch resolves)',
      control: { type: 'select' },
      options: ['ayce', 'express', 'drinks', 'kids'],
    },
    modality: {
      description: 'Destination AYCE modality (ignored outside ayce)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
} satisfies Meta<typeof MenuSkeleton>

export default meta
type Story = StoryObj<typeof meta>

/** AYCE · All You Can Eat — 8 chip placeholders + 6 dish-card placeholders. */
export const AyceBuffet: Story = {}

/** AYCE · Carta — 11 chip placeholders. */
export const AyceCarta: Story = {
  args: { selection: 'ayce', modality: 'carta' },
}

/** Express — 8 chip placeholders. */
export const Express: Story = {
  args: { selection: 'express', modality: 'buffet' },
}

/** Bebidas y coctelería — 6 drink-group chip placeholders. */
export const Bebidas: Story = {
  args: { selection: 'drinks', modality: 'buffet' },
}

/** Kids — no chip row (single flat list, matching `showCategoryChips === false`). */
export const Kids: Story = {
  args: { selection: 'kids', modality: 'buffet' },
}

/**
 * Under `prefers-reduced-motion: reduce`, every nested `UiSkeleton` disables
 * its pulse via `motion-reduce:animate-none` (see MenuSkeleton.spec.ts).
 * Emulate via your browser/OS "reduce motion" setting to see this hold still.
 */
export const ReducedMotion: Story = {
  args: { selection: 'ayce', modality: 'buffet' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
