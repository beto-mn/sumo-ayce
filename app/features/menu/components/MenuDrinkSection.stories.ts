import type { Meta, StoryObj } from '@storybook/vue3-vite'
import type { DrinkGroupMeta, FullMenuDish } from '@/types/menu'
import MenuDrinkSection from './MenuDrinkSection.vue'

function sub(key: string, es: string, en: string, order: number) {
  return {
    key,
    name: { es, en },
    subtitle: null,
    promo: null,
    displayOrder: order,
  }
}

const drinks: FullMenuDish[] = [
  // Cantaritos y Vasos Sumo — one consolidated Vaso Sumo card + a full-image card
  {
    id: 'cf',
    name: { es: 'Cantarito Fest', en: 'Cantarito Fest' },
    description: {
      es: 'Jarrito 750 ml a base de New Mix.',
      en: '750 ml New Mix jar.',
    },
    imageUrl: 'https://placehold.co/400x300',
    badge: { es: 'Sabor a elegir', en: 'Choose your flavor' },
    price: '155.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'cantaritos_sumo_cups',
    drinkSubGroup: null,
    featured: false,
    highlightBackground: false,
    optionGroups: [],
  },
  {
    id: 'vs',
    name: { es: 'Vaso Sumo', en: 'Sumo Cup' },
    description: {
      es: 'Vaso SUMO 960 ml, base a elegir.',
      en: 'SUMO cup 960 ml, choose your base.',
    },
    imageUrl: 'https://placehold.co/400x300',
    badge: { es: 'Base a elegir', en: 'Choose your base' },
    price: '159.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'cantaritos_sumo_cups',
    drinkSubGroup: null,
    featured: false,
    highlightBackground: false,
    // Part E: the flavor picker is now DB-driven via optionGroups, not a
    // hardcoded i18n-keyed special case for "Vaso Sumo" specifically.
    optionGroups: [
      {
        key: 'flavor',
        name: { es: 'Sabor', en: 'Flavor' },
        choices: [
          { id: 'f1', name: { es: 'Ron', en: 'Rum' }, priceDelta: '0.00' },
          {
            id: 'f2',
            name: { es: 'Tequila', en: 'Tequila' },
            priceDelta: '0.00',
          },
          { id: 'f3', name: { es: 'Vodka', en: 'Vodka' }, priceDelta: '0.00' },
          {
            id: 'f4',
            name: { es: 'Whisky', en: 'Whisky' },
            priceDelta: '0.00',
          },
          {
            id: 'f5',
            name: { es: 'New Mix', en: 'New Mix' },
            priceDelta: '0.00',
          },
          {
            id: 'f6',
            name: { es: "Jack Daniel's", en: "Jack Daniel's" },
            priceDelta: '0.00',
          },
        ],
      },
    ],
  },
]

const beers: FullMenuDish[] = [
  {
    id: 'cag',
    name: { es: 'Caguamón en Bolsa', en: 'Beer Bag' },
    description: { es: 'Indio o XX Lager.', en: 'Indio or XX Lager.' },
    imageUrl: 'https://placehold.co/400x300',
    badge: null,
    price: '149.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'beers',
    drinkSubGroup: sub('caguamon', 'Caguamón', 'Beer Bag', 0),
    featured: false,
    highlightBackground: false,
    optionGroups: [],
  },
  {
    id: 'indio',
    name: { es: 'Indio', en: 'Indio' },
    description: { es: '325 ml.', en: '325 ml.' },
    imageUrl: null,
    badge: null,
    price: '59.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'beers',
    drinkSubGroup: sub(
      'cerveza_nacional',
      'Cerveza Nacional',
      'National Beer',
      1
    ),
    featured: false,
    highlightBackground: false,
    optionGroups: [],
  },
]

const destilados: FullMenuDish[] = [
  {
    id: 'bacardi',
    name: { es: 'Bacardí Blanco', en: 'Bacardí Blanco' },
    description: { es: 'Ron.', en: 'Rum.' },
    imageUrl: null,
    badge: { es: '700 ml · Botella $699', en: '700 ml · Bottle $699' },
    price: '119.00',
    incluido: false,
    includedInAyce: false,
    drinkGroup: 'destilados',
    drinkSubGroup: sub('ron', 'Ron', 'Rum', 0),
    featured: false,
    highlightBackground: false,
    optionGroups: [],
  },
]

const drinkGroups: DrinkGroupMeta[] = [
  {
    key: 'cantaritos_sumo_cups',
    name: { es: 'Cantaritos y Vasos Sumo', en: 'Cantaritos & Sumo Cups' },
    displayOrder: 1,
    promo: null,
  },
  {
    key: 'beers',
    name: { es: 'Cervezas', en: 'Beers' },
    displayOrder: 3,
    promo: null,
  },
  {
    key: 'destilados',
    name: { es: 'Destilados', en: 'Spirits' },
    displayOrder: 4,
    promo: {
      es: 'Combo Mezcladores $189: incluye 2 sabores y 2 minerales.',
      en: 'Mixer Combo $189: includes 2 flavors and 2 mineral waters.',
    },
  },
]

const meta = {
  title: 'Menu/MenuDrinkSection',
  component: MenuDrinkSection,
  tags: ['autodocs'],
  args: { drinks, drinkGroups, activeGroup: 'cantaritos_sumo_cups' },
  argTypes: {
    drinks: {
      description: 'All drink dishes (the section slices to the active group)',
      control: { type: 'object' },
    },
    drinkGroups: {
      description: 'Ordered group metadata (display order + group-level promo)',
      control: { type: 'object' },
    },
    activeGroup: {
      description: 'The single active drink-group key resolved by the shell',
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof MenuDrinkSection>

export default meta
type Story = StoryObj<typeof meta>

/**
 * Cantaritos y Vasos Sumo — the consolidated Vaso Sumo card shows the base
 * selector with SIX chips: Ron, Tequila, Vodka, Whisky, New Mix, Jack Daniel's.
 */
export const CantaritosWithVasoSumo: Story = {}

/** Cervezas — Caguamón sub-group ordered first; the no-image beer is half width. */
export const BeersCaguamonFirst: Story = {
  args: { drinks: beers, activeGroup: 'beers' },
}

/** Destilados — the 2x1 / Combo Mezcladores promo renders once at the group level. */
export const DestiladosSinglePromo: Story = {
  args: { drinks: destilados, activeGroup: 'destilados' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
