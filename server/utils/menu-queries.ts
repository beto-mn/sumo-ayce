import { and, asc, eq, inArray, or } from 'drizzle-orm'
import type {
  FeaturedDishRow,
  FullMenuCategory,
  FullMenuDish,
  FullMenuResult,
  FullMenuSauce,
  MenuCategoryKey,
  MenuModality,
} from '@/types/menu'
import { resolveImageUrl } from '../api/v1/menu/resolveImageUrl'
import {
  drinkGroups,
  drinkSubGroups,
  menuCategories,
  menuItems,
  sauces,
} from '../db/schema'
import { db } from './db'

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
  }
}

/**
 * Returns the featured + active subset of the menu (food and drinks), shaped so
 * the homepage route maps each row 1:1 to feature 010's `FeaturedDish`. Throws on
 * DB failure — the calling route categorizes and degrades (Article XII).
 */
export async function getFeaturedDishes(): Promise<FeaturedDishRow[]> {
  const rows: FeaturedQueryRow[] = await db
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
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
    .where(
      and(
        eq(menuItems.featured, true),
        eq(menuItems.isActive, true),
        eq(menuCategories.isActive, true)
      )
    )
    .orderBy(asc(menuItems.displayOrder), asc(menuItems.createdAt))

  return rows.map(toFeaturedDishRow)
}

// ─── Full menu (menu page) ──────────────────────────────────────────────────────

interface MenuQueryRow {
  categoryKey: string
  categoryNameEs: string
  categoryNameEn: string
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
  requiresSauce: boolean
}

interface SauceQueryRow {
  id: string
  nameEs: string
  nameEn: string
  spiceLevel: number
  fileName: string | null
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
  modality: MenuModality
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
    drinkGroup: row.drinkGroup as FullMenuDish['drinkGroup'],
    drinkSubGroup,
    requiresSauce: row.requiresSauce,
  }
}

function groupByCategory(
  rows: MenuQueryRow[],
  modality: MenuModality
): FullMenuCategory[] {
  const byKey = new Map<string, FullMenuCategory>()
  for (const row of rows) {
    let category = byKey.get(row.categoryKey)
    if (!category) {
      category = {
        key: row.categoryKey as MenuCategoryKey,
        name: { es: row.categoryNameEs, en: row.categoryNameEn },
        displayOrder: row.categoryOrder,
        dishes: [],
      }
      byKey.set(row.categoryKey, category)
    }
    category.dishes.push(toFullMenuDish(row, modality))
  }
  return [...byKey.values()]
}

async function queryMenuRows(
  locationType: 'ayce' | 'express',
  modality: MenuModality
): Promise<MenuQueryRow[]> {
  return db
    .select({
      categoryKey: menuCategories.key,
      categoryNameEs: menuCategories.nameEs,
      categoryNameEn: menuCategories.nameEn,
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
      requiresSauce: menuItems.requiresSauce,
    })
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

async function querySauces(): Promise<FullMenuSauce[]> {
  const rows: SauceQueryRow[] = await db
    .select({
      id: sauces.id,
      nameEs: sauces.nameEs,
      nameEn: sauces.nameEn,
      spiceLevel: sauces.spiceLevel,
      fileName: sauces.fileName,
    })
    .from(sauces)
    .where(eq(sauces.isActive, true))
    .orderBy(asc(sauces.spiceLevel))

  return rows.map(row => ({
    id: row.id,
    name: { es: row.nameEs, en: row.nameEn },
    imageUrl: resolveImageUrl(row.fileName),
    spiceLevel: row.spiceLevel,
  }))
}

/**
 * Returns the full menu for a location type + modality, grouped by category in
 * display order. Express is coerced to the buffet view; price-vs-"incluido" is
 * derived per the resolved modality. Throws on DB failure (route categorizes).
 */
export async function getFullMenu(params: {
  locationType: 'ayce' | 'express'
  modality: MenuModality
}): Promise<FullMenuResult> {
  const modality = resolveModality(params.locationType, params.modality)
  const rows = await queryMenuRows(params.locationType, modality)
  const sauceCatalog = await querySauces()
  return {
    locationType: params.locationType,
    modality,
    categories: groupByCategory(rows, modality),
    sauces: sauceCatalog,
  }
}
