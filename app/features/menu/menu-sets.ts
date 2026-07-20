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

/**
 * AYCE · Carta (11) — neither Sándwiches nor Burritos; Kids is a standalone view.
 * Burgers/Hot Dogs/Cold Rolls/Hot Rolls reference the à la carte-only `_carta`
 * category-key variants (feature 029, Part C — category split), which carry the
 * combo note and are populated exclusively by à la carte items
 * (`server/db/seeds/alaCarta.ts`). `AYCE_BUFFET_SET`/`EXPRESS_SET` keep
 * referencing the original shared keys, populated by their own item rows.
 */
export const AYCE_CARTA_SET: MenuCategoryKey[] = [
  'appetizers',
  'salads',
  'rice',
  'ramen',
  'burgers_carta',
  'hot_dogs_carta',
  'cold_rolls_carta',
  'hot_rolls_carta',
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
 * Filters curated-set keys down to the subset also present in `availableKeys`
 * (the live category/drink-group keys from the current menu content read),
 * preserving curated order (feature 023 — drift guard).
 *
 * Invariants: never adds a key that wasn't already in `keys` (curated sets
 * remain the sole source of *candidate* chips — FR-007); never reorders `keys`
 * (FR-003); pure, no side effects.
 */
export function filterAvailableKeys(
  keys: string[],
  availableKeys: Set<string>
): string[] {
  return keys.filter(key => availableKeys.has(key))
}

/**
 * Resolves an incoming (deep-linked) key against the active set: returns it when
 * it is a member, otherwise the view's default — never an out-of-set key, so the
 * view is never empty (FR-013d).
 *
 * When `availableKeys` is supplied (feature 023), membership is checked against
 * the curated set filtered to entries that also exist in the current menu
 * content read, so a curated-but-no-longer-available key is treated exactly
 * like a key that was never curated at all — falls back to the default (FR-005).
 */
export function resolveActiveKey(
  selection: PrimarySelection,
  modality: AyceModality,
  requested: string | null | undefined,
  availableKeys?: Set<string>
): string {
  const curated = getCuratedSet(selection, modality)
  const set = availableKeys
    ? filterAvailableKeys(curated, availableKeys)
    : curated
  if (requested && set.includes(requested)) return requested
  return getDefaultKey(selection)
}
