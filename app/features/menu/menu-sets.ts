import type { DrinkGroup, MenuCategoryKey } from '@/types/menu'

/**
 * Curated, ordered category/group sets per primary selection (and AYCE modality).
 * These encode the client-confirmed taxonomy and the three intentional
 * asymmetries literally (Sándwiches → AYCE·buffet only; Burritos → Express only;
 * AYCE·carta has neither). Membership + order live here — NOT in the templates —
 * so the sets can be reordered/amended without touching the presentation layer.
 *
 * Source of truth: `specs/_batch-intake/intake.md` (confirmed contract).
 */

export type PrimarySelection = 'ayce' | 'express' | 'drinks' | 'kids'
export type AyceModality = 'buffet' | 'carta'

/** AYCE · All You Can Eat (8) — includes Sándwiches, excludes Burritos. */
export const AYCE_BUFFET_SET: MenuCategoryKey[] = [
  'appetizers',
  'burgers',
  'sandwiches',
  'hot_dogs',
  'cold_rolls',
  'hot_rolls',
  'sweet_rolls',
  'wings',
]

/** AYCE · Carta (11) — neither Sándwiches nor Burritos; Kids is a standalone view. */
export const AYCE_CARTA_SET: MenuCategoryKey[] = [
  'appetizers',
  'salads',
  'rice',
  'ramen',
  'burgers',
  'hot_dogs',
  'cold_rolls',
  'hot_rolls',
  'sweet_rolls',
  'desserts',
  'wings',
]

/** Express (8) — includes Burritos, excludes Sándwiches; Kids is a standalone view. */
export const EXPRESS_SET: MenuCategoryKey[] = [
  'appetizers',
  'burgers',
  'burritos',
  'hot_dogs',
  'cold_rolls',
  'hot_rolls',
  'sweet_rolls',
  'wings',
]

/** Bebidas y coctelería (6 drink groups), in confirmed display order. */
export const DRINKS_SET: DrinkGroup[] = [
  'jumbo_cocktails',
  'cantaritos_sumo_cups',
  'sodas',
  'beers',
  'destilados',
  'coffee_digestifs',
]

/**
 * Kids (1) — a single flat list, NOT a category-chip row. The `kids` key is the
 * DB category the Kids view queries; it renders as one section with no chips.
 */
export const KIDS_SET: MenuCategoryKey[] = ['kids']

/** Default visible category/group for each view. */
export const DEFAULT_FOOD_CATEGORY: MenuCategoryKey = 'appetizers'
export const DEFAULT_DRINK_GROUP: DrinkGroup = 'jumbo_cocktails'
export const DEFAULT_KIDS_CATEGORY: MenuCategoryKey = 'kids'

/** Returns the ordered set of category/group keys for the active selection. */
export function getCuratedSet(
  selection: PrimarySelection,
  modality: AyceModality
): string[] {
  if (selection === 'drinks') return DRINKS_SET
  if (selection === 'kids') return KIDS_SET
  if (selection === 'express') return EXPRESS_SET
  return modality === 'carta' ? AYCE_CARTA_SET : AYCE_BUFFET_SET
}

/** Returns the default visible key for the active selection. */
export function getDefaultKey(selection: PrimarySelection): string {
  if (selection === 'drinks') return DEFAULT_DRINK_GROUP
  if (selection === 'kids') return DEFAULT_KIDS_CATEGORY
  return DEFAULT_FOOD_CATEGORY
}

/**
 * Resolves an incoming (deep-linked) key against the active set: returns it when
 * it is a member, otherwise the view's default — never an out-of-set key, so the
 * view is never empty (FR-013d).
 */
export function resolveActiveKey(
  selection: PrimarySelection,
  modality: AyceModality,
  requested: string | null | undefined
): string {
  const set = getCuratedSet(selection, modality)
  if (requested && set.includes(requested)) return requested
  return getDefaultKey(selection)
}
