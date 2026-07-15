import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import {
  drinkGroups,
  drinkSubGroups,
  menuCategories,
  menuItems,
} from '../schema'

const COMBO_PROMO_ES =
  'Combo Mezcladores $189: incluye 2 sabores y 2 minerales de 355 ml cada lata.'
const COMBO_PROMO_EN =
  'Mixer Combo $189: includes 2 flavors and 2 mineral waters of 355 ml each can.'
const SPIRIT_SUBTITLE_ES =
  '2x1 Todos los días • Recibe 2 copas de 60 ml del mismo destilado o licor con un mezclador de 355 ml.'
const SPIRIT_SUBTITLE_EN =
  '2x1 Every day • Get 2 glasses of 60 ml of the same spirit or liqueur with a 355 ml mixer.'

export const DRINK_GROUPS: {
  groupKey: string
  nameEs: string
  nameEn: string
  subtitleEs: string | null
  subtitleEn: string | null
  promoEs: string | null
  promoEn: string | null
  displayOrder: number
}[] = [
  {
    groupKey: 'jumbo_cocktails',
    nameEs: 'Coctelería Jumbo',
    nameEn: 'Jumbo Cocktails',
    subtitleEs: '960 ml',
    subtitleEn: '960 ml',
    promoEs: null,
    promoEn: null,
    displayOrder: 0,
  },
  {
    groupKey: 'cantaritos_sumo_cups',
    nameEs: 'Cantaritos y Vasos Sumo',
    nameEn: 'Cantaritos & Sumo Cups',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
    displayOrder: 1,
  },
  {
    groupKey: 'sodas',
    nameEs: 'Refrescos y Bebidas',
    nameEn: 'Sodas & Beverages',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
    displayOrder: 2,
  },
  {
    // Renamed from the former combined `beers_spirits` group — now Cervezas only.
    groupKey: 'beers',
    nameEs: 'Cervezas',
    nameEn: 'Beers',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
    displayOrder: 3,
  },
  {
    // NEW group split out of the former `beers_spirits`. The "2x1 / Combo
    // Mezcladores $189" note lives here at the GROUP level so it renders ONCE.
    groupKey: 'destilados',
    nameEs: 'Destilados',
    nameEn: 'Spirits',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: COMBO_PROMO_ES,
    promoEn: COMBO_PROMO_EN,
    displayOrder: 4,
  },
  {
    groupKey: 'coffee_digestifs',
    nameEs: 'Café y Digestivos',
    nameEn: 'Coffee & Digestifs',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
    displayOrder: 5,
  },
]

/**
 * FK-safe reset of ALL drink data, in child→parent order, so the drinks reseed
 * is idempotent against a DB that still holds the pre-021 schema (legacy
 * `beers_spirits` + `non_alcoholic` groups, their sub-groups, and referencing
 * menu_items). Must run BEFORE any drink_group DELETE — otherwise the group
 * DELETE violates `menu_items_drink_group_id_fkey` /
 * `drink_sub_group_drink_group_id_fkey`.
 *
 *   1. bebidas menu_items  (reference drink_group_id + drink_sub_group_id)
 *   2. drink_sub_groups    (reference drink_group_id)
 *   3. (legacy) drink_groups — deleted by the caller after the upsert
 */
async function resetDrinkChildren(): Promise<void> {
  const [bebidasCategory] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.key, 'drinks'))
    .limit(1)

  if (bebidasCategory) {
    await db
      .delete(menuItems)
      .where(eq(menuItems.categoryId, bebidasCategory.id))
  }
  // No other table references drink_sub_group, so clearing it fully is safe now
  // that the referencing bebidas menu_items are gone. seedDrinkSubGroups then
  // re-inserts the sub-groups fresh under their new parent groups.
  await db.delete(drinkSubGroups)
}

export async function seedDrinkGroups() {
  console.log('  → Seeding drink groups…')

  // Clear children FIRST so the legacy-group DELETEs below are FK-safe.
  await resetDrinkChildren()

  for (const group of DRINK_GROUPS) {
    await db
      .insert(drinkGroups)
      .values(group)
      .onConflictDoUpdate({
        target: drinkGroups.groupKey,
        set: {
          nameEs: group.nameEs,
          nameEn: group.nameEn,
          subtitleEs: group.subtitleEs,
          subtitleEn: group.subtitleEn,
          promoEs: group.promoEs,
          promoEn: group.promoEn,
          displayOrder: group.displayOrder,
        },
      })
  }

  // Remove the legacy combined group (renamed to `beers`; destilados split out)
  // and the standalone Sin Alcohol group (its items now fold into `sodas` —
  // "Refrescos y Bebidas (incluye Sin Alcohol)").
  await db.delete(drinkGroups).where(eq(drinkGroups.groupKey, 'beers_spirits'))
  await db.delete(drinkGroups).where(eq(drinkGroups.groupKey, 'non_alcoholic'))

  console.log(`  ✓ ${DRINK_GROUPS.length} drink groups upserted`)
}
