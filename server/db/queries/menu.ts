import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import { drinkGroups, menuCategories, menuItems } from '../schema'

// ─── Types ───────────────────────────────────────────────────────────────────

type MenuItemWithCategory = typeof menuItems.$inferSelect & {
  category: Pick<
    typeof menuCategories.$inferSelect,
    'key' | 'nameEs' | 'nameEn'
  >
}

type FullMenuOptions = {
  locationType?: 'ayce' | 'express'
}

// ─── Query helpers ────────────────────────────────────────────────────────────

/**
 * Returns all menu items where featured = true AND is_active = true,
 * joined with their parent category (key, nameEs, nameEn).
 */
export async function getFeaturedDishes(): Promise<MenuItemWithCategory[]> {
  const rows = await db
    .select({
      id: menuItems.id,
      categoryId: menuItems.categoryId,
      nameEs: menuItems.nameEs,
      nameEn: menuItems.nameEn,
      descriptionEs: menuItems.descriptionEs,
      descriptionEn: menuItems.descriptionEn,
      locationType: menuItems.locationType,
      price: menuItems.price,
      includedInAyce: menuItems.includedInAyce,
      fileName: menuItems.fileName,
      badgeEs: menuItems.badgeEs,
      badgeEn: menuItems.badgeEn,
      featured: menuItems.featured,
      drinkGroup: drinkGroups.groupKey,
      requiresSauce: menuItems.requiresSauce,
      isActive: menuItems.isActive,
      displayOrder: menuItems.displayOrder,
      createdAt: menuItems.createdAt,
      updatedAt: menuItems.updatedAt,
      category: {
        key: menuCategories.key,
        nameEs: menuCategories.nameEs,
        nameEn: menuCategories.nameEn,
      },
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
    .where(and(eq(menuItems.featured, true), eq(menuItems.isActive, true)))

  return rows
}

/**
 * Returns all active menu items joined with their parent category.
 * When locationType is 'ayce', only items with locationType 'ayce' or 'both' are returned.
 * When locationType is 'express', only items with locationType 'express' or 'both' are returned.
 */
export async function getFullMenu(
  options?: FullMenuOptions
): Promise<MenuItemWithCategory[]> {
  const locationFilter = buildLocationFilter(options?.locationType)

  const rows = await db
    .select({
      id: menuItems.id,
      categoryId: menuItems.categoryId,
      nameEs: menuItems.nameEs,
      nameEn: menuItems.nameEn,
      descriptionEs: menuItems.descriptionEs,
      descriptionEn: menuItems.descriptionEn,
      locationType: menuItems.locationType,
      price: menuItems.price,
      includedInAyce: menuItems.includedInAyce,
      fileName: menuItems.fileName,
      badgeEs: menuItems.badgeEs,
      badgeEn: menuItems.badgeEn,
      featured: menuItems.featured,
      drinkGroup: drinkGroups.groupKey,
      requiresSauce: menuItems.requiresSauce,
      isActive: menuItems.isActive,
      displayOrder: menuItems.displayOrder,
      createdAt: menuItems.createdAt,
      updatedAt: menuItems.updatedAt,
      category: {
        key: menuCategories.key,
        nameEs: menuCategories.nameEs,
        nameEn: menuCategories.nameEn,
      },
    })
    .from(menuItems)
    .innerJoin(menuCategories, eq(menuItems.categoryId, menuCategories.id))
    .leftJoin(drinkGroups, eq(menuItems.drinkGroupId, drinkGroups.id))
    .where(locationFilter)

  return rows
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function buildLocationFilter(locationType?: 'ayce' | 'express') {
  if (locationType === 'ayce') {
    return and(
      eq(menuItems.isActive, true),
      inArray(menuItems.locationType, ['ayce', 'both'])
    )
  }
  if (locationType === 'express') {
    return and(
      eq(menuItems.isActive, true),
      inArray(menuItems.locationType, ['express', 'both'])
    )
  }
  return eq(menuItems.isActive, true)
}
