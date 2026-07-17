import { and, asc, eq, inArray, or } from 'drizzle-orm'
import type {
  DishOptionChoice,
  DishOptionGroup,
  DrinkGroup,
  DrinkGroupMeta,
  FeaturedDishRow,
  FullMenuCategory,
  FullMenuDish,
  FullMenuResult,
  MenuCategoryKey,
  MenuModality,
} from '@/types/menu'
import { resolveImageUrl } from '../api/v1/menu/resolveImageUrl'
import {
  drinkGroups,
  drinkSubGroups,
  menuCategories,
  menuItemOptionChoices,
  menuItemOptionGroups,
  menuItems,
} from '../db/schema'
import { db } from './db'
import { isTransientDbError, withDbRetry } from './db-retry'
import { DatabaseUnavailableError } from './error-handler'

// ─── Featured dishes (homepage rail) ────────────────────────────────────────────

interface FeaturedQueryRow {
  id: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs: string | null
  badgeEn: string | null
  category: string
  locationType: string
  includedInAyce: boolean
}

function toFeaturedDishRow(row: FeaturedQueryRow): FeaturedDishRow {
  return {
    id: row.id,
    name: { es: row.nameEs, en: row.nameEn },
    description: { es: row.descriptionEs, en: row.descriptionEn },
    imageUrl: resolveImageUrl(row.fileName),
    badge:
      row.badgeEs != null || row.badgeEn != null
        ? { es: row.badgeEs ?? '', en: row.badgeEn ?? '' }
        : null,
    category: row.category as MenuCategoryKey,
    locationType: row.locationType as FeaturedDishRow['locationType'],
    includedInAyce: row.includedInAyce,
  }
}

/**
 * Collapses the featured rows to one per dish name. A Garantía Sumo dish is
 * flagged `featured` on EVERY location/modality row (so the star shows in every
 * menu view), but the homepage rail must list each dish exactly once. Rows arrive
 * ordered by `displayOrder` (the dish's featuredOrder), so the first row seen per
 * name is the canonical one — later duplicate rows are dropped.
 */
function dedupeByName(rows: FeaturedQueryRow[]): FeaturedQueryRow[] {
  const seen = new Set<string>()
  const unique: FeaturedQueryRow[] = []
  for (const row of rows) {
    if (seen.has(row.nameEs)) continue
    seen.add(row.nameEs)
    unique.push(row)
  }
  return unique
}

/**
 * Returns the featured + active subset of the menu (food and drinks), deduped to
 * one row per dish name and ordered by rail position, shaped so the homepage route
 * maps each row 1:1 to feature 010's `FeaturedDish`. Reads are retried on transient
 * Neon errors; if the DB stays unavailable it throws a `DatabaseUnavailableError`
 * (handled: WARN + graceful fallback), otherwise the original error.
 */
export async function getFeaturedDishes(): Promise<FeaturedDishRow[]> {
  try {
    const rows: FeaturedQueryRow[] = await withDbRetry(
      'getFeaturedDishes',
      () =>
        db
          .select({
            id: menuItems.id,
            nameEs: menuItems.nameEs,
            nameEn: menuItems.nameEn,
            descriptionEs: menuItems.descriptionEs,
            descriptionEn: menuItems.descriptionEn,
            fileName: menuItems.fileName,
            badgeEs: menuItems.badgeEs,
            badgeEn: menuItems.badgeEn,
            category: menuCategories.key,
            locationType: menuItems.locationType,
            includedInAyce: menuItems.includedInAyce,
          })
          .from(menuItems)
          .innerJoin(
            menuCategories,
            eq(menuItems.categoryId, menuCategories.id)
          )
          .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
          .where(
            and(
              eq(menuItems.featured, true),
              eq(menuItems.isActive, true),
              eq(menuCategories.isActive, true)
            )
          )
          .orderBy(asc(menuItems.displayOrder), asc(menuItems.createdAt))
    )
    return dedupeByName(rows).map(toFeaturedDishRow)
  } catch (error) {
    if (isTransientDbError(error))
      throw new DatabaseUnavailableError('getFeaturedDishes', error)
    throw error
  }
}

// ─── Full menu (menu page) ──────────────────────────────────────────────────────

interface MenuQueryRow {
  categoryKey: string
  categoryNameEs: string
  categoryNameEn: string
  categoryNoteEs: string | null
  categoryNoteEn: string | null
  categoryOrder: number
  dishId: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs: string | null
  badgeEn: string | null
  price: string | null
  includedInAyce: boolean
  drinkGroup: string | null
  drinkSubGroupKey: string | null
  drinkSubGroupNameEs: string | null
  drinkSubGroupNameEn: string | null
  drinkSubGroupSubtitleEs: string | null
  drinkSubGroupSubtitleEn: string | null
  drinkSubGroupPromoEs: string | null
  drinkSubGroupPromoEn: string | null
  drinkSubGroupOrder: number | null
  featured: boolean
  highlightBackground: boolean
}

/** À-la-carte (`carta`) is AYCE-only; Express is always coerced to the buffet view. */
function resolveModality(
  locationType: 'ayce' | 'express',
  requested: MenuModality
): MenuModality {
  return locationType === 'express' ? 'buffet' : requested
}

function toFullMenuDish(
  row: MenuQueryRow,
  modality: MenuModality,
  optionGroupsByDish: Map<string, DishOptionGroup[]>
): FullMenuDish {
  const isCarta = modality === 'carta'
  const drinkSubGroup =
    row.drinkSubGroupKey && row.drinkSubGroupNameEs && row.drinkSubGroupNameEn
      ? {
          key: row.drinkSubGroupKey,
          name: { es: row.drinkSubGroupNameEs, en: row.drinkSubGroupNameEn },
          subtitle:
            row.drinkSubGroupSubtitleEs != null ||
            row.drinkSubGroupSubtitleEn != null
              ? {
                  es: row.drinkSubGroupSubtitleEs ?? '',
                  en: row.drinkSubGroupSubtitleEn ?? '',
                }
              : null,
          promo:
            row.drinkSubGroupPromoEs != null || row.drinkSubGroupPromoEn != null
              ? {
                  es: row.drinkSubGroupPromoEs ?? '',
                  en: row.drinkSubGroupPromoEn ?? '',
                }
              : null,
          displayOrder: row.drinkSubGroupOrder ?? 0,
        }
      : null
  return {
    id: row.dishId,
    name: { es: row.nameEs, en: row.nameEn },
    description: { es: row.descriptionEs, en: row.descriptionEn },
    imageUrl: resolveImageUrl(row.fileName),
    badge:
      row.badgeEs != null || row.badgeEn != null
        ? { es: row.badgeEs ?? '', en: row.badgeEn ?? '' }
        : null,
    price: isCarta || row.drinkGroup !== null ? row.price : null,
    incluido: isCarta || row.drinkGroup !== null ? false : row.includedInAyce,
    includedInAyce: row.includedInAyce,
    drinkGroup: row.drinkGroup as FullMenuDish['drinkGroup'],
    drinkSubGroup,
    featured: row.featured,
    highlightBackground: row.highlightBackground,
    optionGroups: optionGroupsByDish.get(row.dishId) ?? [],
  }
}

function groupByCategory(
  rows: MenuQueryRow[],
  modality: MenuModality,
  optionGroupsByDish: Map<string, DishOptionGroup[]>
): FullMenuCategory[] {
  const byKey = new Map<string, FullMenuCategory>()
  for (const row of rows) {
    let category = byKey.get(row.categoryKey)
    if (!category) {
      category = {
        key: row.categoryKey as MenuCategoryKey,
        name: { es: row.categoryNameEs, en: row.categoryNameEn },
        note:
          row.categoryNoteEs != null || row.categoryNoteEn != null
            ? { es: row.categoryNoteEs ?? '', en: row.categoryNoteEn ?? '' }
            : null,
        displayOrder: row.categoryOrder,
        dishes: [],
      }
      byKey.set(row.categoryKey, category)
    }
    category.dishes.push(toFullMenuDish(row, modality, optionGroupsByDish))
  }
  return [...byKey.values()]
}

/** Shared column projection for the full-menu and kids-view row queries. */
const MENU_ROW_SELECTION = {
  categoryKey: menuCategories.key,
  categoryNameEs: menuCategories.nameEs,
  categoryNameEn: menuCategories.nameEn,
  categoryNoteEs: menuCategories.noteEs,
  categoryNoteEn: menuCategories.noteEn,
  categoryOrder: menuCategories.displayOrder,
  dishId: menuItems.id,
  nameEs: menuItems.nameEs,
  nameEn: menuItems.nameEn,
  descriptionEs: menuItems.descriptionEs,
  descriptionEn: menuItems.descriptionEn,
  fileName: menuItems.fileName,
  badgeEs: menuItems.badgeEs,
  badgeEn: menuItems.badgeEn,
  price: menuItems.price,
  includedInAyce: menuItems.includedInAyce,
  drinkGroup: drinkGroups.groupKey,
  drinkSubGroupKey: drinkSubGroups.key,
  drinkSubGroupNameEs: drinkSubGroups.nameEs,
  drinkSubGroupNameEn: drinkSubGroups.nameEn,
  drinkSubGroupSubtitleEs: drinkSubGroups.subtitleEs,
  drinkSubGroupSubtitleEn: drinkSubGroups.subtitleEn,
  drinkSubGroupPromoEs: drinkSubGroups.promoEs,
  drinkSubGroupPromoEn: drinkSubGroups.promoEn,
  drinkSubGroupOrder: drinkSubGroups.displayOrder,
  featured: menuItems.featured,
  highlightBackground: menuItems.highlightBackground,
}

async function queryMenuRows(
  locationType: 'ayce' | 'express',
  modality: MenuModality
): Promise<MenuQueryRow[]> {
  return db
    .select(MENU_ROW_SELECTION)
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
    .leftJoin(drinkSubGroups, eq(menuItems.drinkSubGroupId, drinkSubGroups.id))
    .where(
      and(
        eq(menuItems.isActive, true),
        eq(menuCategories.isActive, true),
        locationScope(locationType),
        ayceModalityFilter(locationType, modality)
      )
    )
    .orderBy(asc(menuCategories.displayOrder), asc(menuItems.displayOrder))
}

/**
 * The Kids view: every active item under the `kids` category, independent of
 * locationType/includedInAyce/modality — Kids is a cross-cutting standalone view,
 * not a food category inside AYCE or Express.
 */
async function queryKidsRows(): Promise<MenuQueryRow[]> {
  return db
    .select(MENU_ROW_SELECTION)
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
    .leftJoin(drinkSubGroups, eq(menuItems.drinkSubGroupId, drinkSubGroups.id))
    .where(
      and(
        eq(menuItems.isActive, true),
        eq(menuCategories.isActive, true),
        eq(menuCategories.key, 'kids')
      )
    )
    .orderBy(asc(menuItems.displayOrder))
}

/** `location_type IN (requested, 'both')` — shared dishes surface in both menus. */
export function locationScope(locationType: 'ayce' | 'express') {
  return inArray(menuItems.locationType, [locationType, 'both'])
}

/**
 * For Express: no filter (Express has no à-la-carte concept).
 * For AYCE buffet: only included items (`includedInAyce = true`) OR drinks (`locationType = 'both'`).
 * For AYCE carta: only à-la-carte items (`includedInAyce = false`) OR drinks (`locationType = 'both'`).
 * Drinks always pass through regardless of modality.
 */
function ayceModalityFilter(
  locationType: 'ayce' | 'express',
  modality: MenuModality
) {
  if (locationType === 'express') return undefined
  return or(
    eq(menuItems.locationType, 'both'),
    eq(menuItems.includedInAyce, modality !== 'carta')
  )
}

interface OptionGroupQueryRow {
  id: string
  menuItemId: string
  key: string
  nameEs: string
  nameEn: string
}

interface OptionChoiceQueryRow {
  id: string
  optionGroupId: string
  nameEs: string
  nameEn: string
  priceDelta: string
}

/**
 * Returns a `menuItemId → DishOptionGroup[]` map for every dish ID given, in
 * one batched pair of queries (groups, then their choices) — mirrors the
 * existing `queryDrinkGroups` batched-query style (no N+1 per dish). A group
 * whose active choices ended up empty is dropped entirely (edge case: an
 * empty picker is never shown). Dishes with no configured groups are simply
 * absent from the returned map (callers default to `[]`).
 */
async function queryOptionGroupsByMenuItem(
  menuItemIds: string[]
): Promise<Map<string, DishOptionGroup[]>> {
  if (menuItemIds.length === 0) return new Map()

  const groupRows: OptionGroupQueryRow[] = await db
    .select({
      id: menuItemOptionGroups.id,
      menuItemId: menuItemOptionGroups.menuItemId,
      key: menuItemOptionGroups.key,
      nameEs: menuItemOptionGroups.nameEs,
      nameEn: menuItemOptionGroups.nameEn,
    })
    .from(menuItemOptionGroups)
    .where(
      and(
        inArray(menuItemOptionGroups.menuItemId, menuItemIds),
        eq(menuItemOptionGroups.isActive, true)
      )
    )
    .orderBy(asc(menuItemOptionGroups.displayOrder))

  if (groupRows.length === 0) return new Map()

  const groupIds = groupRows.map(g => g.id)
  const choiceRows: OptionChoiceQueryRow[] = await db
    .select({
      id: menuItemOptionChoices.id,
      optionGroupId: menuItemOptionChoices.optionGroupId,
      nameEs: menuItemOptionChoices.nameEs,
      nameEn: menuItemOptionChoices.nameEn,
      priceDelta: menuItemOptionChoices.priceDelta,
    })
    .from(menuItemOptionChoices)
    .where(
      and(
        inArray(menuItemOptionChoices.optionGroupId, groupIds),
        eq(menuItemOptionChoices.isActive, true)
      )
    )
    .orderBy(asc(menuItemOptionChoices.displayOrder))

  const choicesByGroup = new Map<string, DishOptionChoice[]>()
  for (const choice of choiceRows) {
    const choices = choicesByGroup.get(choice.optionGroupId) ?? []
    choices.push({
      id: choice.id,
      name: { es: choice.nameEs, en: choice.nameEn },
      priceDelta: choice.priceDelta,
    })
    choicesByGroup.set(choice.optionGroupId, choices)
  }

  const groupsByDish = new Map<string, DishOptionGroup[]>()
  for (const group of groupRows) {
    const choices = choicesByGroup.get(group.id) ?? []
    if (choices.length === 0) continue
    const groups = groupsByDish.get(group.menuItemId) ?? []
    groups.push({
      key: group.key,
      name: { es: group.nameEs, en: group.nameEn },
      choices,
    })
    groupsByDish.set(group.menuItemId, groups)
  }
  return groupsByDish
}

interface DrinkGroupQueryRow {
  groupKey: string
  nameEs: string | null
  nameEn: string | null
  displayOrder: number
  promoEs: string | null
  promoEn: string | null
}

/**
 * Returns the drink-group metadata (DB display label + deterministic display
 * order + a single group-level promo note) in display order. The `name` is the
 * single source of truth for the Bebidas chip + section heading. Carries the
 * Destilados "2x1 / Combo Mezcladores" note once at the group level.
 */
async function queryDrinkGroups(): Promise<DrinkGroupMeta[]> {
  const rows: DrinkGroupQueryRow[] = await db
    .select({
      groupKey: drinkGroups.groupKey,
      nameEs: drinkGroups.nameEs,
      nameEn: drinkGroups.nameEn,
      displayOrder: drinkGroups.displayOrder,
      promoEs: drinkGroups.promoEs,
      promoEn: drinkGroups.promoEn,
    })
    .from(drinkGroups)
    .orderBy(asc(drinkGroups.displayOrder))

  return rows.map(row => ({
    key: row.groupKey as DrinkGroup,
    name: { es: row.nameEs ?? '', en: row.nameEn ?? row.nameEs ?? '' },
    displayOrder: row.displayOrder,
    promo:
      row.promoEs != null || row.promoEn != null
        ? { es: row.promoEs ?? '', en: row.promoEn ?? '' }
        : null,
  }))
}

/**
 * Returns the full menu for a view type + modality, grouped by category in
 * display order. Express is coerced to the buffet view; the Kids view returns the
 * kids-category items regardless of location scope and always uses 'carta' pricing
 * (each combo has a fixed price). Throws on DB failure (route categorizes).
 */
export async function getFullMenu(params: {
  locationType: 'ayce' | 'express' | 'kids'
  modality: MenuModality
}): Promise<FullMenuResult> {
  try {
    return await withDbRetry('getFullMenu', async () => {
      if (params.locationType === 'kids') {
        const rows = await queryKidsRows()
        const drinkGroupMeta = await queryDrinkGroups()
        const optionGroupsByDish = await queryOptionGroupsByMenuItem(
          rows.map(r => r.dishId)
        )
        return {
          locationType: 'kids' as const,
          modality: 'carta' as const,
          categories: groupByCategory(rows, 'carta', optionGroupsByDish),
          drinkGroups: drinkGroupMeta,
        }
      }

      const modality = resolveModality(params.locationType, params.modality)
      const rows = await queryMenuRows(params.locationType, modality)
      const drinkGroupMeta = await queryDrinkGroups()
      const optionGroupsByDish = await queryOptionGroupsByMenuItem(
        rows.map(r => r.dishId)
      )
      return {
        locationType: params.locationType,
        modality,
        categories: groupByCategory(rows, modality, optionGroupsByDish),
        drinkGroups: drinkGroupMeta,
      }
    })
  } catch (error) {
    if (isTransientDbError(error))
      throw new DatabaseUnavailableError('getFullMenu', error)
    throw error
  }
}

/**
 * An empty menu result the /menu API + page render as a friendly "temporarily
 * unavailable" state when Neon is down (instead of a raw 500).
 */
export function emptyMenuResult(
  locationType: 'ayce' | 'express' | 'kids',
  modality: MenuModality
): FullMenuResult {
  return {
    locationType,
    modality: locationType === 'express' ? 'buffet' : modality,
    categories: [],
    drinkGroups: [],
  }
}
