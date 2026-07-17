import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuDish } from '@/types/menu'
import MenuDishCard from './MenuDishCard.vue'

const base: FullMenuDish = {
  id: 'd1',
  name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
  description: {
    es: 'Salmón flameado con aguacate y sriracha.',
    en: 'Flamed salmon with avocado and sriracha.',
  },
  imageUrl: 'https://placehold.co/400x300',
  badge: null,
  price: null,
  incluido: true,
  includedInAyce: true,
  drinkGroup: null,
  drinkSubGroup: null,
  featured: false,
  highlightBackground: false,
  optionGroups: [],
}

const meta = {
  title: 'Menu/MenuDishCard',
  component: MenuDishCard,
  tags: ['autodocs'],
  args: { dish: base, modality: 'buffet' },
  argTypes: {
    dish: {
      description:
        'FullMenuDish with localized name/description, imageUrl, badge and price. The whole card gently zooms on hover and lifts above its neighbors (hover-capable devices only; no zoom under reduced motion).',
      control: { type: 'object' },
    },
    modality: {
      description: 'Menu modality: buffet ("Incluido") or carta (price shown)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
    highlightBackground: {
      description:
        'Swaps the image panel background for the orange→blue gradient instead of the plain default (Part D — "All You Can Eat Kids" only; driven by `dish.highlightBackground`).',
      control: { type: 'boolean' },
      table: { category: 'Appearance' },
    },
  },
} satisfies Meta<typeof MenuDishCard>

export default meta
type Story = StoryObj<typeof meta>

/** Default buffet card — hover the card to see the whole-card zoom (desktop pointers). */
export const Default: Story = {}

export const NoImage: Story = {
  args: { dish: { ...base, imageUrl: null } },
}

export const WithBadge: Story = {
  args: { dish: { ...base, badge: { es: 'Nuevo', en: 'New' } } },
}

/**
 * Garantía Sumo (featured): the curated dishes show the star badge overlay at
 * top-left (from `/brand/garantia-sumo.webp`, bumped to a 96px `size-24` —
 * up from 64px — per the client's "no se nota" feedback), clear of the
 * top-right badge.
 */
export const FeaturedGarantiaSumo: Story = {
  args: {
    dish: { ...base, featured: true, badge: { es: 'Nuevo', en: 'New' } },
  },
}

/** Alitas & Boneless no longer show a sauce picker (FR-021). */
export const WingsWithoutSaucePicker: Story = {
  args: {
    dish: {
      ...base,
      name: { es: 'Boneless', en: 'Boneless' },
    },
  },
}

export const CartaWithPrice: Story = {
  args: {
    dish: { ...base, price: '128.00', incluido: false },
    modality: 'carta',
  },
}

export const LocaleES: Story = {
  name: 'Locale ES (español)',
  parameters: { globals: { locale: 'es' } },
}

export const LocaleEN: Story = {
  name: 'Locale EN (English)',
  parameters: { globals: { locale: 'en' } },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

/**
 * Highlighted background (Part D): the "All You Can Eat Kids" card gets an
 * orange→blue gradient behind its image panel instead of the plain default —
 * scoped to that one dish via `dish.highlightBackground`.
 */
export const HighlightBackground: Story = {
  name: 'Highlighted background (All You Can Eat Kids)',
  args: {
    dish: {
      ...base,
      name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
      price: '179.00',
      incluido: false,
    },
    modality: 'carta',
    highlightBackground: true,
  },
}

/**
 * DB-driven "build your own" option groups (Part C, revised): "Ramen XL"
 * renders as a completely normal dish card, additionally showing one
 * `MenuSaucePicker` per configured option group beneath its description —
 * sourced from the new generic option-groups tables, not hardcoded.
 */
export const WithOptionGroups: Story = {
  name: 'With option groups (Ramen XL build-your-own)',
  args: {
    dish: {
      ...base,
      name: { es: 'Ramen XL', en: 'Ramen XL' },
      description: {
        es: 'Ramen XL en caldo de tu elección, con proteína a elegir y toppings extras al gusto.',
        en: 'XL ramen in your choice of broth, with your choice of protein and extra toppings.',
      },
      price: '149.00',
      incluido: false,
      featured: true,
      optionGroups: [
        {
          key: 'noodle_base',
          name: { es: 'Base de fideo', en: 'Noodle base' },
          choices: [
            {
              id: 'nb1',
              name: { es: 'Pollo', en: 'Chicken' },
              priceDelta: '0.00',
            },
            {
              id: 'nb2',
              name: { es: 'Camarón cremoso', en: 'Creamy shrimp' },
              priceDelta: '0.00',
            },
            {
              id: 'nb3',
              name: { es: 'Camarón picante', en: 'Spicy shrimp' },
              priceDelta: '0.00',
            },
            {
              id: 'nb4',
              name: { es: 'Vegetales picantes', en: 'Spicy vegetables' },
              priceDelta: '0.00',
            },
          ],
        },
        {
          key: 'protein',
          name: { es: 'Proteína', en: 'Protein' },
          choices: [
            { id: 'p1', name: { es: 'Res', en: 'Beef' }, priceDelta: '0.00' },
            {
              id: 'p2',
              name: { es: 'Camarón', en: 'Shrimp' },
              priceDelta: '0.00',
            },
            {
              id: 'p3',
              name: { es: 'Pollo', en: 'Chicken' },
              priceDelta: '0.00',
            },
          ],
        },
        {
          key: 'extra_protein',
          name: { es: 'Añade extra proteína', en: 'Add extra protein' },
          choices: [
            {
              id: 'ep1',
              name: { es: 'No, gracias', en: 'No, thanks' },
              priceDelta: '0.00',
            },
            {
              id: 'ep2',
              name: {
                es: 'Sí, extra proteína (+$29)',
                en: 'Yes, extra protein (+$29)',
              },
              priceDelta: '29.00',
            },
          ],
        },
      ],
    },
    modality: 'carta',
  },
}
