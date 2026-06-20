import type { Bilingual } from '@/types/content'

/**
 * Shared menu types — the contract surface between the menu data layer
 * (`server/utils/menu-queries.ts`) and its consuming server routes
 * (features 010 homepage rail, 011 menu page). Reuses `Bilingual` from
 * `types/content.ts`; does NOT redeclare feature 010's `FeaturedDish`.
 */

export type MenuLocationType = 'ayce' | 'express' | 'both'

/** Modality is a read-time query param, never a stored column. `carta` (à-la-carte) is AYCE-only. */
export type MenuModality = 'buffet' | 'carta'

export type MenuCategoryKey =
  | 'entradas'
  | 'burgers'
  | 'sandwich'
  | 'burritos'
  | 'hotdogs'
  | 'frio'
  | 'caliente'
  | 'dulce'
  | 'postres'
  | 'alitas'
  | 'salsas'
  | 'extras'
  | 'bebidas'

export type DrinkGroup =
  | 'jumbo_cocktails'
  | 'cantaritos_sumo_cups'
  | 'non_alcoholic'
  | 'sodas'
  | 'coffee_digestifs'
  | 'beers_spirits'

/**
 * A featured dish/drink row, ready for the homepage rail. The route resolves
 * `name` to the active locale (`name[locale] || name.es`) → feature 010's
 * `FeaturedDish.name: string`, and passes the rest through 1:1.
 */
export interface FeaturedDishRow {
  id: string
  name: Bilingual
  description: Bilingual
  imageUrl: string | null
  badge: string | null
  category: MenuCategoryKey
}

export interface FullMenuDish {
  id: string
  name: Bilingual
  description: Bilingual
  imageUrl: string | null
  badge: string | null
  /** Decimal as string; present ONLY when modality === 'carta' and the dish has a price. */
  price: string | null
  /** True when the dish is shown as "incluido" (buffet) instead of a price. */
  incluido: boolean
  drinkGroup: DrinkGroup | null
  requiresSauce: boolean
}

export interface FullMenuCategory {
  key: MenuCategoryKey
  name: Bilingual
  displayOrder: number
  dishes: FullMenuDish[]
}

export interface FullMenuSauce {
  id: string
  name: Bilingual
  displayOrder: number
}

export interface FullMenuResult {
  /** The resolved request location (never 'both'). */
  locationType: Exclude<MenuLocationType, 'both'>
  /** The resolved effective modality (Express is coerced to 'buffet'). */
  modality: MenuModality
  categories: FullMenuCategory[]
  /** The active sauce-picker catalog (the 12 Wings & Boneless sauces). */
  sauces: FullMenuSauce[]
}
