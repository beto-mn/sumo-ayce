import { db } from '../../utils/db'
import { drinkGroups, drinkSubGroups } from '../schema'

type SubGroupSeed = {
  drinkGroupKey: string
  key: string
  nameEs: string
  nameEn: string
  subtitleEs?: string
  subtitleEn?: string
  promoEs?: string
  promoEn?: string
  displayOrder: number
}

// Per-spirit-sub-group subtitle/promo are intentionally NULL: the "2x1 / Combo
// Mezcladores $189" note is now carried ONCE at the `destilados` GROUP level
// (see drinkGroups.ts) instead of repeated per sub-group.
export const SUB_GROUPS: SubGroupSeed[] = [
  // ─── Cervezas (group `beers`) — Caguamón first ───────────────────────────────
  {
    drinkGroupKey: 'beers',
    key: 'caguamon',
    nameEs: 'Caguamón',
    nameEn: 'Beer Bag',
    displayOrder: 0,
  },
  {
    drinkGroupKey: 'beers',
    key: 'cerveza_nacional',
    nameEs: 'Cerveza Nacional',
    nameEn: 'National Beer',
    displayOrder: 1,
  },
  {
    drinkGroupKey: 'beers',
    key: 'cerveza_premium',
    nameEs: 'Cerveza Premium',
    nameEn: 'Premium Beer',
    displayOrder: 2,
  },
  {
    drinkGroupKey: 'beers',
    key: 'cerveza',
    nameEs: 'Cerveza',
    nameEn: 'Beer',
    displayOrder: 3,
  },
  // ─── Destilados (group `destilados`) ─────────────────────────────────────────
  {
    drinkGroupKey: 'destilados',
    key: 'ron',
    nameEs: 'Ron',
    nameEn: 'Rum',
    displayOrder: 0,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'vodka',
    nameEs: 'Vodka',
    nameEn: 'Vodka',
    displayOrder: 1,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'brandy',
    nameEs: 'Brandy',
    nameEn: 'Brandy',
    displayOrder: 2,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'mezcal',
    nameEs: 'Mezcal',
    nameEn: 'Mezcal',
    displayOrder: 3,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'ginebra',
    nameEs: 'Ginebra',
    nameEn: 'Gin',
    displayOrder: 4,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'tequila',
    nameEs: 'Tequila',
    nameEn: 'Tequila',
    displayOrder: 5,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'whisky',
    nameEs: 'Whisky',
    nameEn: 'Whisky',
    displayOrder: 6,
  },
  {
    drinkGroupKey: 'destilados',
    key: 'cremas_licores',
    nameEs: 'Cremas y Licores',
    nameEn: 'Cream Liqueurs',
    displayOrder: 7,
  },
  // ─── Extras de bebidas (stay under Cervezas) ─────────────────────────────────
  {
    drinkGroupKey: 'beers',
    key: 'extras_bebidas',
    nameEs: 'Extras de Bebidas',
    nameEn: 'Drink Add-ons',
    displayOrder: 4,
  },
]

export async function seedDrinkSubGroups() {
  console.log('  → Seeding drink sub-groups…')

  const groupRows = await db
    .select({ id: drinkGroups.id, groupKey: drinkGroups.groupKey })
    .from(drinkGroups)
  const groupIdByKey = Object.fromEntries(
    groupRows.map((r: { groupKey: string; id: string }) => [r.groupKey, r.id])
  )

  for (const sg of SUB_GROUPS) {
    const drinkGroupId = groupIdByKey[sg.drinkGroupKey]
    if (!drinkGroupId) {
      throw new Error(
        `drinkGroups row for key="${sg.drinkGroupKey}" not found — run drinkGroups seed first`
      )
    }
    await db
      .insert(drinkSubGroups)
      .values({
        drinkGroupId,
        key: sg.key,
        nameEs: sg.nameEs,
        nameEn: sg.nameEn,
        subtitleEs: sg.subtitleEs ?? null,
        subtitleEn: sg.subtitleEn ?? null,
        promoEs: sg.promoEs ?? null,
        promoEn: sg.promoEn ?? null,
        displayOrder: sg.displayOrder,
      })
      .onConflictDoUpdate({
        target: drinkSubGroups.key,
        set: {
          drinkGroupId,
          nameEs: sg.nameEs,
          nameEn: sg.nameEn,
          subtitleEs: sg.subtitleEs ?? null,
          subtitleEn: sg.subtitleEn ?? null,
          promoEs: sg.promoEs ?? null,
          promoEn: sg.promoEn ?? null,
          displayOrder: sg.displayOrder,
        },
      })
  }

  console.log(`  ✓ ${SUB_GROUPS.length} drink sub-groups upserted`)
}
