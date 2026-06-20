import { and, asc, eq, inArray } from 'drizzle-orm'
import type {
  FeaturedDishRow,
  FullMenuCategory,
  FullMenuDish,
  FullMenuResult,
  FullMenuSauce,
  MenuCategoryKey,
  MenuModality,
} from '@/types/menu'
import { menuCategories, menuItems, sauces } from '../db/schema'
import { db } from './db'

// ─── Featured dishes (homepage rail) ────────────────────────────────────────────

interface FeaturedQueryRow {
  id: string
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badge: string | null
  category: string
}

function toFeaturedDishRow(row: FeaturedQueryRow): FeaturedDishRow {
  return {
    id: row.id,
    name: { es: row.nameEs, en: row.nameEn },
    description: { es: row.descriptionEs, en: row.descriptionEn },
    imageUrl: row.fileName,
    badge: row.badge,
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
      badge: menuItems.badge,
      category: menuCategories.key,
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
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
  badge: string | null
  price: string | null
  includedInAyce: boolean
  drinkGroup: string | null
  requiresSauce: boolean
}

interface SauceQueryRow {
  id: string
  nameEs: string
  nameEn: string
  displayOrder: number
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
  return {
    id: row.dishId,
    name: { es: row.nameEs, en: row.nameEn },
    description: { es: row.descriptionEs, en: row.descriptionEn },
    imageUrl: row.fileName,
    badge: row.badge,
    price: isCarta ? row.price : null,
    incluido: isCarta ? false : row.includedInAyce,
    drinkGroup: row.drinkGroup as FullMenuDish['drinkGroup'],
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
  locationType: 'ayce' | 'express'
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
      badge: menuItems.badge,
      price: menuItems.price,
      includedInAyce: menuItems.includedInAyce,
      drinkGroup: menuItems.drinkGroup,
      requiresSauce: menuItems.requiresSauce,
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .where(
      and(
        eq(menuItems.isActive, true),
        eq(menuCategories.isActive, true),
        locationScope(locationType)
      )
    )
    .orderBy(asc(menuCategories.displayOrder), asc(menuItems.displayOrder))
}

/** `location_type IN (requested, 'both')` — shared dishes surface in both menus. */
function locationScope(locationType: 'ayce' | 'express') {
  return inArray(menuItems.locationType, [locationType, 'both'])
}

async function querySauces(): Promise<FullMenuSauce[]> {
  const rows: SauceQueryRow[] = await db
    .select({
      id: sauces.id,
      nameEs: sauces.nameEs,
      nameEn: sauces.nameEn,
      displayOrder: sauces.displayOrder,
    })
    .from(sauces)
    .where(eq(sauces.isActive, true))
    .orderBy(asc(sauces.displayOrder))

  return rows.map(row => ({
    id: row.id,
    name: { es: row.nameEs, en: row.nameEn },
    displayOrder: row.displayOrder,
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
  const rows = await queryMenuRows(params.locationType)
  const sauceCatalog = await querySauces()
  return {
    locationType: params.locationType,
    modality,
    categories: groupByCategory(rows, modality),
    sauces: sauceCatalog,
  }
}
