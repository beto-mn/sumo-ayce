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
  | 'appetizers'
  | 'salads'
  | 'rice'
  | 'ramen'
  | 'burgers'
  | 'sandwiches'
  | 'burritos'
  | 'hot_dogs'
  | 'cold_rolls'
  | 'hot_rolls'
  | 'sweet_rolls'
  | 'desserts'
  | 'wings'
  | 'sauces'
  | 'extras'
  | 'drinks'
  | 'kids'

export type DrinkGroup =
  | 'jumbo_cocktails'
  | 'cantaritos_sumo_cups'
  | 'sodas'
  | 'coffee_digestifs'
  | 'beers'
  | 'destilados'

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
  badge: Bilingual | null
  category: MenuCategoryKey
  /** Branch scope + buffet flag, for the card's /menu deep link. */
  locationType: MenuLocationType
  includedInAyce: boolean
}

export interface DrinkSubGroup {
  key: string
  name: Bilingual
  subtitle: Bilingual | null
  promo: Bilingual | null
  /** Sort order within its drink group (e.g. Caguamón first). */
  displayOrder: number
}

/** A single selectable choice within a `DishOptionGroup` (e.g. "Camarón cremoso"). */
export interface DishOptionChoice {
  id: string
  name: Bilingual
  /** Decimal-as-string price addition for selecting this choice; matches the existing `price: string | null` convention. */
  priceDelta: string
}

/**
 * A generic, reusable "build your own" option group attached to a menu item
 * (e.g. "Base de fideo", "Proteína", "Añade extra proteína", "Sabor"). Not
 * specific to any one dish — any menu item may have zero or more of these.
 */
export interface DishOptionGroup {
  key: string
  name: Bilingual
  choices: DishOptionChoice[]
}

export interface FullMenuDish {
  id: string
  name: Bilingual
  description: Bilingual
  imageUrl: string | null
  badge: Bilingual | null
  /** Decimal as string; present ONLY when modality === 'carta' and the dish has a price. */
  price: string | null
  /** True when the dish is shown as "incluido" (buffet) instead of a price. */
  incluido: boolean
  /** Raw `included_in_ayce` flag; the Kids view splits its list on this (buffet vs. combo). */
  includedInAyce: boolean
  drinkGroup: DrinkGroup | null
  drinkSubGroup: DrinkSubGroup | null
  /** True for the curated "Garantía Sumo" dishes — the card shows a star badge. */
  featured: boolean
  /**
   * Per-dish highlight flag, independent of category membership: `true` →
   * `MenuDishCard` renders the orange→blue gradient image-panel background
   * (e.g. All You Can Eat Kids); `false` (default) → unchanged.
   */
  highlightBackground: boolean
  /**
   * DB-driven "build your own" option groups attached to this dish/drink
   * (e.g. Ramen XL's noodle-base/protein/extra-protein, Vaso Sumo's flavor).
   * `[]` for the overwhelming majority of dishes with no groups configured.
   */
  optionGroups: DishOptionGroup[]
}

export interface FullMenuCategory {
  key: MenuCategoryKey
  name: Bilingual
  /** Optional section note rendered at the TOP of a sub-section (e.g. Kids "Combo Infantil" inclusions). */
  note: Bilingual | null
  displayOrder: number
  dishes: FullMenuDish[]
}

/**
 * Group-level metadata for the Bebidas view: deterministic display order and a
 * single group-level promo note (e.g. the Destilados "2x1 / Combo Mezcladores"
 * note rendered ONCE for the whole group instead of per sub-group).
 */
export interface DrinkGroupMeta {
  key: DrinkGroup
  /** Display label (DB-sourced) for the Bebidas chip + section heading. */
  name: Bilingual
  displayOrder: number
  promo: Bilingual | null
}

/** The primary menu view a full-menu request resolves for. `kids` is a cross-cutting standalone view. */
export type MenuViewType = 'ayce' | 'express' | 'kids'

export interface FullMenuResult {
  /** The resolved request view (`ayce | express | kids`). */
  locationType: MenuViewType
  /** The resolved effective modality (Express is coerced to 'buffet'; Kids uses 'carta' pricing). */
  modality: MenuModality
  categories: FullMenuCategory[]
  /** Ordered drink-group metadata (order + group-level promo) for the Bebidas view. */
  drinkGroups: DrinkGroupMeta[]
}
