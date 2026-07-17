import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuCategory } from '@/types/menu'
import MenuDishGrid from './MenuDishGrid.vue'

const categories: FullMenuCategory[] = [
  {
    key: 'cold_rolls',
    name: { es: 'Sushi Frío', en: 'Cold Rolls' },
    note: null,
    displayOrder: 0,
    dishes: [
      {
        id: 'd1',
        name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
        description: {
          es: 'Salmón flameado con aguacate.',
          en: 'Flamed salmon with avocado.',
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
      },
      {
        id: 'd2',
        name: { es: 'Spider Roll', en: 'Spider Roll' },
        description: {
          es: 'Cangrejo de caparazón blando.',
          en: 'Soft-shell crab.',
        },
        imageUrl: null,
        badge: { es: 'Nuevo', en: 'New' },
        price: null,
        incluido: true,
        includedInAyce: true,
        drinkGroup: null,
        drinkSubGroup: null,
        featured: false,
        highlightBackground: false,
        optionGroups: [],
      },
    ],
  },
  {
    key: 'wings',
    name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
    note: null,
    displayOrder: 1,
    dishes: [
      {
        id: 'd3',
        name: { es: 'Boneless', en: 'Boneless' },
        description: {
          es: 'Pieza de pollo empanizado.',
          en: 'Breaded chicken piece.',
        },
        imageUrl: null,
        badge: null,
        price: null,
        incluido: true,
        includedInAyce: true,
        drinkGroup: null,
        drinkSubGroup: null,
        featured: false,
        highlightBackground: false,
        optionGroups: [],
      },
    ],
  },
]

const meta = {
  title: 'Menu/MenuDishGrid',
  component: MenuDishGrid,
  tags: ['autodocs'],
  args: { categories, modality: 'buffet' },
  argTypes: {
    categories: {
      description:
        'The single active category (as a one-element array) to render. Every dish renders uniformly via MenuDishCard — differences (highlighted background, DB-driven option-group pickers) are prop-driven, not a per-dish component swap.',
      control: { type: 'object' },
    },
    modality: {
      description:
        'Menu modality: buffet (all-inclusive) or carta (a la carte with prices)',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
} satisfies Meta<typeof MenuDishGrid>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const CartaModality: Story = {
  args: {
    modality: 'carta',
    categories: [
      {
        key: 'cold_rolls',
        name: { es: 'Sushi Frío', en: 'Cold Rolls' },
        note: null,
        displayOrder: 0,
        dishes: [
          {
            id: 'd1-carta',
            name: { es: 'Bora Bora Roll', en: 'Bora Bora Roll' },
            description: {
              es: 'Salmón flameado con aguacate.',
              en: 'Flamed salmon with avocado.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '128.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            featured: false,
            highlightBackground: false,
            optionGroups: [],
          },
        ],
      },
    ],
  },
}

export const EmptyCategory: Story = {
  args: {
    categories: [
      {
        key: 'ramen',
        name: { es: 'Ramen', en: 'Ramen' },
        note: null,
        displayOrder: 0,
        dishes: [],
      },
    ],
  },
}

/**
 * Kids view — the TWO ordered sub-sections the Kids primary type renders:
 * 1) "All You Can Eat Kids" ($179 buffet, no note); 2) "Combo Infantil" (the
 * $149 combos) with the inclusion NOTE (yellow pop box) at the top of that
 * section only. Headings are i18n copy; the note is DB-driven.
 */
export const KidsList: Story = {
  args: {
    modality: 'carta',
    categories: [
      {
        key: 'kids',
        name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
        note: null,
        displayOrder: 0,
        dishes: [
          {
            id: 'kids-ayce',
            name: { es: 'All You Can Eat Kids', en: 'All You Can Eat Kids' },
            description: {
              es: 'Buffet all you can eat para niños de 2 a 10 años. Precio por persona, promoción individual (no para compartir).',
              en: 'All you can eat buffet for children ages 2 to 10. Price per person, individual promotion (not for sharing).',
            },
            imageUrl: null,
            badge: null,
            price: '179.00',
            incluido: false,
            includedInAyce: true,
            drinkGroup: null,
            drinkSubGroup: null,
            featured: false,
            // Part D: orange→blue gradient behind the image panel, scoped to
            // this one dish only.
            highlightBackground: true,
            optionGroups: [],
          },
        ],
      },
      {
        key: 'kids',
        name: { es: 'Combo Infantil', en: 'Kids Combo' },
        note: {
          es: 'Incluye papas a la francesa (100 g), refresco (400 ml), sushi kids (5 pzas de cualquier rollo de nuestra carta) y un yakimeshi (240 g).',
          en: 'Includes french fries (100 g), a soft drink (400 ml), sushi kids (5 pcs of any roll from our menu) and a yakimeshi (240 g).',
        },
        displayOrder: 1,
        dishes: [
          {
            id: 'kid-burger',
            name: { es: 'Kid Burger', en: 'Kid Burger' },
            description: {
              es: '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
              en: '60g smash beef patty with American cheese, lettuce and American dressing. Served with french fries.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '149.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            featured: false,
            highlightBackground: false,
            optionGroups: [],
          },
        ],
      },
    ],
  },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

/**
 * Part C (revised): "Ramen XL" renders as a completely NORMAL MenuDishCard —
 * identical in layout to its sibling dish — but additionally shows its 3
 * DB-driven "build your own" option-group pickers beneath its description.
 * No hero/showcase visual treatment of any kind (FR-012).
 */
export const RamenXlWithOptionGroups: Story = {
  name: 'Ramen category: Ramen XL build-your-own + normal sibling dish',
  args: {
    modality: 'carta',
    categories: [
      {
        key: 'ramen',
        name: { es: 'Ramen', en: 'Ramen' },
        note: null,
        displayOrder: 0,
        dishes: [
          {
            id: 'ramen-xl',
            name: { es: 'Ramen XL', en: 'Ramen XL' },
            description: {
              es: 'Ramen XL en caldo de tu elección, con proteína a elegir y toppings extras al gusto.',
              en: 'XL ramen in your choice of broth, with your choice of protein and extra toppings.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '149.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            featured: true,
            highlightBackground: false,
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
                ],
              },
              {
                key: 'protein',
                name: { es: 'Proteína', en: 'Protein' },
                choices: [
                  {
                    id: 'p1',
                    name: { es: 'Res', en: 'Beef' },
                    priceDelta: '0.00',
                  },
                  {
                    id: 'p2',
                    name: { es: 'Camarón', en: 'Shrimp' },
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
          {
            id: 'ramen-normal',
            name: { es: 'Ramen Tradicional', en: 'Traditional Ramen' },
            description: {
              es: 'Ramen clásico en caldo shoyu.',
              en: 'Classic shoyu-broth ramen.',
            },
            imageUrl: 'https://placehold.co/400x300',
            badge: null,
            price: '119.00',
            incluido: false,
            includedInAyce: false,
            drinkGroup: null,
            drinkSubGroup: null,
            featured: false,
            highlightBackground: false,
            optionGroups: [],
          },
        ],
      },
    ],
  },
}

/**
 * "Alitas & Boneless" section — the heat-thermometer legend graphic mounts
 * ONCE at the section level (not per dish); each Wings/Boneless dish shows NO
 * interactive sauce-selection control — sauce choice is descriptive text
 * only (spec.md Revision 2026-07-17, FR-006-REV — the interactive picker was
 * scrapped after the client saw the final thermometer graphic). The category
 * note ("Escoge tu salsa favorita") reuses the same yellow-pop note box as
 * the Kids "Combo Infantil" note (feature 028, Part C).
 */
export const WingsSectionWithThermometer: Story = {
  name: 'Alitas & Boneless: section-level thermometer, descriptive sauce text only',
  args: {
    modality: 'buffet',
    categories: [
      {
        key: 'wings',
        name: { es: 'Alitas & Boneless', en: 'Wings & Boneless' },
        note: {
          es: 'Escoge tu salsa favorita',
          en: 'Choose your favorite sauce',
        },
        displayOrder: 0,
        dishes: [
          {
            id: 'alitas-ayce',
            name: { es: 'Alitas', en: 'Chicken Wings' },
            description: {
              es: '5 alitas de pollo con una salsa a elegir.',
              en: '5 chicken wings with your choice of sauce.',
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
          },
          {
            id: 'boneless-ayce',
            name: { es: 'Boneless', en: 'Boneless' },
            description: {
              es: 'Trozos de pechuga empanizados con una salsa a elegir.',
              en: 'Breaded chicken bites with your choice of sauce.',
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
          },
        ],
      },
    ],
  },
}
