import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, h } from 'vue'

/**
 * Tokens smoke test — proves the design token surface resolves to identical
 * values whether consumed via Tailwind utility classes OR via raw CSS
 * variables. The two boxes below MUST render pixel-identical at any
 * viewport (per FR-301 / FR-302 / SC-005). Wrapping the pair in
 * .scope-express also flips both --accent references to --blue (FR-303 / SC-006).
 */
const TokensDemo = defineComponent({
  name: 'TokensDemo',
  setup() {
    return () =>
      h('div', { class: 'flex flex-col gap-6 p-6' }, [
        h('div', { class: 'grid grid-cols-1 md:grid-cols-2 gap-6' }, [
          h(
            'div',
            {
              class:
                'bg-bg text-ink border-pop border-ink shadow-pop rounded-pop font-disp text-h-lg p-6 text-center',
            },
            'Tailwind utilities'
          ),
          h(
            'div',
            {
              style: {
                background: 'rgb(var(--bg))',
                color: 'rgb(var(--ink))',
                borderColor: 'rgb(var(--ink))',
                borderStyle: 'solid',
                borderWidth: '3px',
                boxShadow: 'var(--shadow)',
                borderRadius: 'var(--r)',
                fontFamily: 'var(--disp)',
                fontSize: 'clamp(32px, 5vw, 60px)',
                padding: '24px',
                textAlign: 'center',
              },
            },
            'CSS variables'
          ),
        ]),
        h('h2', { class: 'font-disp text-h-lg uppercase' }, 'Accent — AYCE'),
        h(
          'div',
          {
            class:
              'bg-accent text-bg border-pop border-ink shadow-pop rounded-pop p-4 font-disp uppercase',
          },
          'bg-accent → orange'
        ),
        h(
          'div',
          {
            class: 'scope-express',
          },
          [
            h(
              'h2',
              { class: 'font-disp text-h-lg uppercase mt-6' },
              'Accent — Express scope'
            ),
            h(
              'div',
              {
                class:
                  'bg-accent text-bg border-pop border-ink shadow-pop rounded-pop p-4 font-disp uppercase',
              },
              'bg-accent → blue'
            ),
            h(
              'div',
              {
                style: {
                  background: 'rgb(var(--accent))',
                  color: 'rgb(var(--bg))',
                  borderRadius: 'var(--r)',
                  padding: '16px',
                  marginTop: '12px',
                },
              },
              'background: rgb(var(--accent)) → blue'
            ),
          ]
        ),
      ])
  },
})

const meta = {
  title: 'UI/_Tokens',
  component: TokensDemo,
  tags: ['autodocs'],
} satisfies Meta<typeof TokensDemo>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

export const Desktop: Story = {
  parameters: { viewport: { defaultViewport: 'desktop' } },
}
