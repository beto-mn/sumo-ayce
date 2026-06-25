import { db } from '../../utils/db'
import { drinkGroups, drinkSubGroups } from '../schema'

const SPIRIT_SUBTITLE_ES =
  '2x1 Todos los días • Recibe 2 copas de 60 ml del mismo destilado o licor con un mezclador de 355 ml.'
const SPIRIT_SUBTITLE_EN =
  '2x1 Every day • Get 2 glasses of 60 ml of the same spirit or liqueur with a 355 ml mixer.'
const SPIRIT_PROMO_ES =
  'Combo Mezcladores $189: incluye 2 sabores y 2 minerales de 355 ml cada lata.'
const SPIRIT_PROMO_EN =
  'Mixer Combo $189: includes 2 flavors and 2 mineral waters of 355 ml each can.'

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

const SUB_GROUPS: SubGroupSeed[] = [
  // ─── Cervezas ───────────────────────────────────────────────────────────────
  {
    drinkGroupKey: 'beers_spirits',
    key: 'cerveza_nacional',
    nameEs: 'Cerveza Nacional',
    nameEn: 'National Beer',
    displayOrder: 0,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'cerveza_premium',
    nameEs: 'Cerveza Premium',
    nameEn: 'Premium Beer',
    displayOrder: 1,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'cerveza',
    nameEs: 'Cerveza',
    nameEn: 'Beer',
    displayOrder: 2,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'caguamon',
    nameEs: 'Caguamón',
    nameEn: 'Beer Bag',
    displayOrder: 3,
  },
  // ─── Destilados (2x1) ───────────────────────────────────────────────────────
  {
    drinkGroupKey: 'beers_spirits',
    key: 'ron',
    nameEs: 'Ron',
    nameEn: 'Rum',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 4,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'vodka',
    nameEs: 'Vodka',
    nameEn: 'Vodka',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 5,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'brandy',
    nameEs: 'Brandy',
    nameEn: 'Brandy',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 6,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'mezcal',
    nameEs: 'Mezcal',
    nameEn: 'Mezcal',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 7,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'ginebra',
    nameEs: 'Ginebra',
    nameEn: 'Gin',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 8,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'tequila',
    nameEs: 'Tequila',
    nameEn: 'Tequila',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 9,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'whisky',
    nameEs: 'Whisky',
    nameEn: 'Whisky',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 10,
  },
  {
    drinkGroupKey: 'beers_spirits',
    key: 'cremas_licores',
    nameEs: 'Cremas y Licores',
    nameEn: 'Cream Liqueurs',
    subtitleEs: SPIRIT_SUBTITLE_ES,
    subtitleEn: SPIRIT_SUBTITLE_EN,
    promoEs: SPIRIT_PROMO_ES,
    promoEn: SPIRIT_PROMO_EN,
    displayOrder: 11,
  },
  // ─── Extras de bebidas ──────────────────────────────────────────────────────
  {
    drinkGroupKey: 'beers_spirits',
    key: 'extras_bebidas',
    nameEs: 'Extras de Bebidas',
    nameEn: 'Drink Add-ons',
    displayOrder: 12,
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
