import { eq, inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import {
  menuItemOptionChoices,
  menuItemOptionGroups,
  menuItems,
} from '../schema'

/**
 * Seed data for the generic, reusable "build your own" option-groups
 * mechanism (feature 027 Parts C & E) — a dish-attachable set of single-select
 * groups, each with N choices, fully staff-editable in the DB with zero code
 * change (adding/removing/renaming a choice or group).
 */

type OptionChoiceSeed = {
  nameEs: string
  nameEn: string
  /** Decimal-as-string price addition; '0.00' for choices with no price impact. */
  priceDelta: string
}

type OptionGroupSeed = {
  key: string
  nameEs: string
  nameEn: string
  choices: OptionChoiceSeed[]
}

type DishOptionsSeed = {
  /** Exact `name_es` of the target `menu_items` row (must already exist). */
  dishNameEs: string
  groups: OptionGroupSeed[]
}

// ─── RAMEN XL — "build your own" (feature 027 Part C) ────────────────────────

const RAMEN_XL_GROUPS: OptionGroupSeed[] = [
  {
    key: 'noodle_base',
    nameEs: 'Base de fideo',
    nameEn: 'Noodle base',
    choices: [
      { nameEs: 'Pollo', nameEn: 'Chicken', priceDelta: '0.00' },
      {
        nameEs: 'Camarón cremoso',
        nameEn: 'Creamy shrimp',
        priceDelta: '0.00',
      },
      {
        nameEs: 'Camarón picante',
        nameEn: 'Spicy shrimp',
        priceDelta: '0.00',
      },
      {
        nameEs: 'Vegetales picantes',
        nameEn: 'Spicy vegetables',
        priceDelta: '0.00',
      },
    ],
  },
  {
    key: 'protein',
    nameEs: 'Proteína',
    nameEn: 'Protein',
    choices: [
      { nameEs: 'Res', nameEn: 'Beef', priceDelta: '0.00' },
      { nameEs: 'Camarón', nameEn: 'Shrimp', priceDelta: '0.00' },
      { nameEs: 'Pollo', nameEn: 'Chicken', priceDelta: '0.00' },
    ],
  },
  {
    key: 'extra_protein',
    nameEs: 'Añade extra proteína',
    nameEn: 'Add extra protein',
    // Modeled as a same-shaped 2-choice group (default $0 "no" + priced "yes")
    // rather than a separate add-on entity type (research.md R6a) — the price
    // is baked into the label text, matching the client's own reference image.
    choices: [
      { nameEs: 'No, gracias', nameEn: 'No, thanks', priceDelta: '0.00' },
      {
        nameEs: 'Sí, extra proteína (+$29)',
        nameEn: 'Yes, extra protein (+$29)',
        priceDelta: '29.00',
      },
    ],
  },
]

// ─── VASO SUMO — flavor picker migration (feature 027 Part E) ───────────────
// Same names/order/(lack of) price impact as the previously hardcoded
// `menu.vaso_sumo.flavor.*` i18n values — a like-for-like migration (FR-023).

const VASO_SUMO_GROUPS: OptionGroupSeed[] = [
  {
    key: 'flavor',
    nameEs: 'Sabor',
    nameEn: 'Flavor',
    choices: [
      { nameEs: 'Ron', nameEn: 'Rum', priceDelta: '0.00' },
      { nameEs: 'Tequila', nameEn: 'Tequila', priceDelta: '0.00' },
      { nameEs: 'Vodka', nameEn: 'Vodka', priceDelta: '0.00' },
      { nameEs: 'Whisky', nameEn: 'Whisky', priceDelta: '0.00' },
      { nameEs: 'New Mix', nameEn: 'New Mix', priceDelta: '0.00' },
      { nameEs: "Jack Daniel's", nameEn: "Jack Daniel's", priceDelta: '0.00' },
    ],
  },
]

export const DISH_OPTIONS_SEED: DishOptionsSeed[] = [
  { dishNameEs: 'Ramen XL', groups: RAMEN_XL_GROUPS },
  { dishNameEs: 'Vaso Sumo', groups: VASO_SUMO_GROUPS },
]

/**
 * Clears any existing option groups (+ their choices, FK-safe child→parent
 * order) for a menu item, so this seed is idempotent / safe to re-run.
 */
async function resetOptionGroups(menuItemId: string): Promise<void> {
  const existingGroups = await db
    .select({ id: menuItemOptionGroups.id })
    .from(menuItemOptionGroups)
    .where(eq(menuItemOptionGroups.menuItemId, menuItemId))
  const existingGroupIds = existingGroups.map((g: { id: string }) => g.id)
  if (existingGroupIds.length === 0) return
  await db
    .delete(menuItemOptionChoices)
    .where(inArray(menuItemOptionChoices.optionGroupId, existingGroupIds))
  await db
    .delete(menuItemOptionGroups)
    .where(eq(menuItemOptionGroups.menuItemId, menuItemId))
}

/** Inserts one dish's option groups + their choices, in display order. */
async function insertDishOptions(
  menuItemId: string,
  groups: OptionGroupSeed[]
): Promise<void> {
  for (const [groupIndex, group] of groups.entries()) {
    const [insertedGroup] = await db
      .insert(menuItemOptionGroups)
      .values({
        menuItemId,
        key: group.key,
        nameEs: group.nameEs,
        nameEn: group.nameEn,
        displayOrder: groupIndex,
        isActive: true,
      })
      .returning({ id: menuItemOptionGroups.id })

    if (!insertedGroup) continue

    await db.insert(menuItemOptionChoices).values(
      group.choices.map((choice, choiceIndex) => ({
        optionGroupId: insertedGroup.id,
        nameEs: choice.nameEs,
        nameEn: choice.nameEn,
        priceDelta: choice.priceDelta,
        displayOrder: choiceIndex,
        isActive: true,
      }))
    )
  }
}

/**
 * Seeds the generic option-groups tables for every dish/drink in
 * `DISH_OPTIONS_SEED`. MUST run after both `seedAlaCarta()` (Ramen XL) and
 * `seedDrinks()` (Vaso Sumo) so the referenced `menu_items` rows already
 * exist.
 */
export async function seedMenuItemOptions() {
  console.log('  → Seeding menu item option groups…')

  const dishNames = DISH_OPTIONS_SEED.map(d => d.dishNameEs)
  const rows = await db
    .select({ id: menuItems.id, nameEs: menuItems.nameEs })
    .from(menuItems)
    .where(inArray(menuItems.nameEs, dishNames))

  const idByName = Object.fromEntries(
    rows.map((r: { nameEs: string; id: string }) => [r.nameEs, r.id])
  )

  for (const dish of DISH_OPTIONS_SEED) {
    const menuItemId = idByName[dish.dishNameEs]
    if (!menuItemId) {
      throw new Error(
        `menu_items row for name_es="${dish.dishNameEs}" not found — run its menu seed first`
      )
    }
    await resetOptionGroups(menuItemId)
    await insertDishOptions(menuItemId, dish.groups)
  }

  console.log(
    `  ✓ option groups seeded for ${DISH_OPTIONS_SEED.length} menu item(s)`
  )
}
