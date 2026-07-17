import type { Decorator, Meta, StoryObj } from '@storybook/vue3-vite'
import type { FullMenuCategory, FullMenuResult } from '@/types/menu'
import MenuCategoryChips from './MenuCategoryChips.vue'
import MenuDishCard from './MenuDishCard.vue'
import MenuDishGrid from './MenuDishGrid.vue'
import MenuDrinkSection from './MenuDrinkSection.vue'
import MenuModalityToggle from './MenuModalityToggle.vue'
import MenuSaucePicker from './MenuSaucePicker.vue'
import MenuShell from './MenuShell.vue'
import MenuTypeToggle from './MenuTypeToggle.vue'

/**
 * Builds a minimal AYCE·buffet category with a single placeholder dish — used
 * to populate every `AYCE_BUFFET_SET` member so the chip row's drift-guard
 * filter (feature 023) has real data to filter against, matching what the
 * curated set expects from a healthy content-store read.
 */
function placeholderCategory(
  key: FullMenuCategory['key'],
  nameEs: string,
  nameEn: string,
  displayOrder: number
): FullMenuCategory {
  return {
    key,
    name: { es: nameEs, en: nameEn },
    note: null,
    displayOrder,
    dishes: [
      {
        id: `${key}-1`,
        name: { es: nameEs, en: nameEn },
        description: { es: `${nameEs}.`, en: `${nameEn}.` },
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
  }
}

const menuData: FullMenuResult = {
  locationType: 'ayce',
  modality: 'buffet',
  categories: [
    {
      key: 'appetizers',
      name: { es: 'Entradas', en: 'Appetizers' },
      note: null,
      displayOrder: 0,
      dishes: [
        {
          id: 'd1',
          name: { es: 'Edamames', en: 'Edamame' },
          description: {
            es: 'Vainas de soya al vapor con sal de mar.',
            en: 'Steamed soybean pods with sea salt.',
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
    // Remaining curated-set members across all three food sets (AYCE·buffet,
    // AYCE·carta, Express) — feature 023's drift guard needs real matching
    // entries to demonstrate the healthy, no-drift case for every story below.
    placeholderCategory('burgers', 'Hamburguesas', 'Burgers', 3),
    placeholderCategory('sandwiches', 'Sándwiches', 'Sandwiches', 4),
    placeholderCategory('burritos', 'Burritos', 'Burritos', 5),
    placeholderCategory('hot_dogs', 'Hot Dogs', 'Hot Dogs', 6),
    placeholderCategory('cold_rolls', 'Sushi Frío', 'Cold Rolls', 7),
    placeholderCategory('hot_rolls', 'Sushi Caliente', 'Hot Rolls', 8),
    placeholderCategory('sweet_rolls', 'Sushi Dulce', 'Sweet Rolls', 9),
    placeholderCategory('wings', 'Alitas & Boneless', 'Wings & Boneless', 10),
    placeholderCategory('salads', 'Ensaladas', 'Salads', 11),
    placeholderCategory('rice', 'Arroz', 'Rice', 12),
    placeholderCategory('ramen', 'Ramen', 'Ramen', 13),
    placeholderCategory('desserts', 'Postres', 'Desserts', 14),
    {
      key: 'drinks',
      name: { es: 'Bebidas', en: 'Drinks' },
      note: null,
      displayOrder: 1,
      dishes: [
        {
          id: 'dr1',
          name: { es: 'Refresco', en: 'Soda' },
          description: { es: '355 ml.', en: '355 ml.' },
          imageUrl: null,
          badge: null,
          price: '69.00',
          incluido: false,
          includedInAyce: false,
          drinkGroup: 'sodas',
          drinkSubGroup: null,
          featured: false,
          highlightBackground: false,
          optionGroups: [],
        },
      ],
    },
    {
      key: 'kids',
      name: { es: 'Menú Kids', en: 'Kids Menu' },
      note: {
        es: 'Incluye papas a la francesa (100 g), refresco (400 ml), sushi kids (5 pzas de cualquier rollo de nuestra carta) y un yakimeshi (240 g).',
        en: 'Includes french fries (100 g), a soft drink (400 ml), sushi kids (5 pcs of any roll from our menu) and a yakimeshi (240 g).',
      },
      displayOrder: 2,
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
          highlightBackground: false,
          optionGroups: [],
        },
        {
          id: 'k1',
          name: { es: 'Kid Burger', en: 'Kid Burger' },
          description: {
            es: '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
            en: '60g smash beef patty with American cheese, lettuce and American dressing. Served with french fries.',
          },
          imageUrl: null,
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
  drinkGroups: [
    {
      key: 'jumbo_cocktails',
      name: { es: 'Coctelería Jumbo', en: 'Jumbo Cocktails' },
      displayOrder: 0,
      promo: null,
    },
    {
      key: 'cantaritos_sumo_cups',
      name: { es: 'Cantaritos y Vasos Sumo', en: 'Cantaritos & Sumo Cups' },
      displayOrder: 1,
      promo: null,
    },
    {
      key: 'sodas',
      name: { es: 'Refrescos y Bebidas', en: 'Sodas & Beverages' },
      displayOrder: 2,
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
      promo: null,
    },
    {
      key: 'coffee_digestifs',
      name: { es: 'Café y Digestivos', en: 'Coffee & Digestifs' },
      displayOrder: 5,
      promo: null,
    },
  ],
}

const meta = {
  title: 'Menu/MenuShell',
  component: MenuShell,
  tags: ['autodocs'],
  args: {
    menuData,
    initialSelection: 'ayce',
    initialModality: 'buffet',
  },
  argTypes: {
    menuData: {
      description:
        'Complete menu result (categories, sauces, drink-group meta)',
      control: { type: 'object' },
    },
    initialSelection: {
      description:
        'Initial primary selection: ayce, express, drinks (Bebidas) or kids',
      control: { type: 'select' },
      options: ['ayce', 'express', 'drinks', 'kids'],
    },
    initialModality: {
      description: 'Initial AYCE modality: buffet or carta',
      control: { type: 'select' },
      options: ['buffet', 'carta'],
    },
  },
  decorators: [
    (story => ({
      components: {
        story,
        MenuTypeToggle,
        MenuModalityToggle,
        MenuCategoryChips,
        MenuDishGrid,
        MenuDishCard,
        MenuSaucePicker,
        MenuDrinkSection,
      },
      template: '<story />',
    })) as Decorator,
  ],
} satisfies Meta<typeof MenuShell>

export default meta
type Story = StoryObj<typeof meta>

/** Default landing: AYCE · All You Can Eat · Entradas (single category). */
export const Default: Story = {}

export const ExpressSelection: Story = {
  args: {
    initialSelection: 'express',
    menuData: { ...menuData, locationType: 'express' },
  },
}

export const CartaModality: Story = {
  args: { initialModality: 'carta' },
}

export const BebidasSelection: Story = {
  args: { initialSelection: 'drinks' },
}

/**
 * Kids view: the standalone Kids primary type renders TWO ordered sub-sections —
 * "All You Can Eat Kids" ($179 buffet) then "Combo Infantil" ($149 combos) with
 * the inclusion note at the top of the Combo section — with NO category-chip row
 * and NO modality toggle, using the same soft/ink accent as Bebidas (both are
 * cross-cutting views).
 */
export const KidsSelection: Story = {
  args: { initialSelection: 'kids' },
}

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}

/**
 * Feature 023 — menu chip / DB drift guard: a curated-set member
 * ("Sándwiches") has been deactivated/removed from the content store while
 * `menu-sets.ts` still lists it (drift). The chip row renders one fewer chip
 * than {@link Default} — no dead "Sándwiches" chip, no untranslated key, and
 * the remaining chips keep their existing curated order.
 */
export const FilteredMissingCategory: Story = {
  args: {
    menuData: {
      ...menuData,
      categories: menuData.categories.filter(c => c.key !== 'sandwiches'),
    },
  },
}

/**
 * Same drift-guard behavior for the Bebidas view: the "Destilados" drink
 * group has been removed from the content store, so its chip disappears
 * from the Bebidas chip row while the rest keep their order.
 */
export const FilteredMissingDrinkGroup: Story = {
  args: {
    initialSelection: 'drinks',
    menuData: {
      ...menuData,
      drinkGroups: menuData.drinkGroups.filter(g => g.key !== 'destilados'),
    },
  },
}
