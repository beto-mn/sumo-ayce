import type { Meta, StoryObj } from '@storybook/vue3-vite'
import MenuTypeToggle from './MenuTypeToggle.vue'

const meta = {
  title: 'Menu/MenuTypeToggle',
  component: MenuTypeToggle,
  tags: ['autodocs'],
  argTypes: {
    activeSelection: {
      description:
        'Active primary selection: AYCE, Express, Bebidas y coctelería or Kids',
      control: { type: 'select' },
      options: ['ayce', 'express', 'drinks', 'kids'],
    },
  },
  args: { activeSelection: 'ayce' },
} satisfies Meta<typeof MenuTypeToggle>

export default meta
type Story = StoryObj<typeof meta>

export const AYCE: Story = {}

export const Express: Story = {
  args: { activeSelection: 'express' },
}

export const Bebidas: Story = {
  args: { activeSelection: 'drinks' },
}

/**
 * Kids active: the standalone Kids pill uses the SAME ink/black treatment as
 * Bebidas — both are cross-cutting views available at either sucursal.
 */
export const Kids: Story = {
  args: { activeSelection: 'kids' },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  parameters: { globals: { locale: 'en' } },
}

/**
 * AYCE with its modality sub-toggle slotted in BETWEEN the [AYCE | Express] pill
 * and the standalone [Bebidas]/[Kids] buttons via the `#modality` slot — the real
 * layout MenuShell composes when AYCE is active. The slot content here is a demo
 * placeholder standing in for MenuModalityToggle (which needs its own props).
 */
export const WithModalitySlot: Story = {
  render: args => ({
    components: { MenuTypeToggle },
    setup: () => ({ args }),
    template: `
      <MenuTypeToggle v-bind="args">
        <template #modality>
          <div class="flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-pop-full border-pop border-ink bg-panel px-5 shadow-pop-sm font-disp font-extrabold uppercase text-kicker sm:w-auto">
            All You Can Eat / Carta
          </div>
        </template>
      </MenuTypeToggle>
    `,
  }),
}

/**
 * Phone (360px): every nav GROUP stacks on its OWN full-width row — the
 * [AYCE | Express] pill, then the modality slot (when AYCE active), then Bebidas,
 * then Kids — each a full-width tap target, no cramping, no horizontal scroll,
 * pop-shadow never clipped. The stacked layout applies only below sm (520px).
 */
export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

/**
 * Tablet (768px, e.g. iPad Air): the groups take their NATURAL content width and
 * WRAP as whole pills (flex-wrap), packing into as few rows as fit (1–2 rows)
 * instead of four full-width stacked rows. Labels stay on one line
 * (whitespace-nowrap); no cramped or squeezed pill. At md (≥880px) they collapse
 * to a single horizontal row.
 */
export const Tablet: Story = {
  parameters: { viewport: { defaultViewport: 'tablet' } },
}
