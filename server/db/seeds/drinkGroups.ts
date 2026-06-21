import { db } from '../../utils/db'
import { drinkGroups } from '../schema'

const DRINK_GROUPS: {
  groupKey: string
  subtitleEs: string | null
  subtitleEn: string | null
  promoEs: string | null
  promoEn: string | null
}[] = [
  {
    groupKey: 'jumbo_cocktails',
    subtitleEs: '960 ml',
    subtitleEn: '960 ml',
    promoEs: null,
    promoEn: null,
  },
  {
    groupKey: 'cantaritos_sumo_cups',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
  },
  {
    groupKey: 'non_alcoholic',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
  },
  {
    groupKey: 'sodas',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
  },
  {
    groupKey: 'coffee_digestifs',
    subtitleEs: null,
    subtitleEn: null,
    promoEs: null,
    promoEn: null,
  },
  {
    groupKey: 'beers_spirits',
    subtitleEs:
      '2x1 Todos los días • Recibe 2 copas de 60 ml del mismo destilado o licor con un mezclador de 355 ml.',
    subtitleEn:
      '2x1 Every day • Get 2 glasses of 60 ml of the same spirit or liqueur with a 355 ml mixer.',
    promoEs:
      'Combo Mezcladores $189: incluye 2 sabores y 2 minerales de 355 ml cada lata.',
    promoEn:
      'Mixer Combo $189: includes 2 flavors and 2 mineral waters of 355 ml each can.',
  },
]

export async function seedDrinkGroups() {
  console.log('  → Seeding drink groups…')

  for (const group of DRINK_GROUPS) {
    await db
      .insert(drinkGroups)
      .values(group)
      .onConflictDoUpdate({
        target: drinkGroups.groupKey,
        set: {
          subtitleEs: group.subtitleEs,
          subtitleEn: group.subtitleEn,
          promoEs: group.promoEs,
          promoEn: group.promoEn,
        },
      })
  }

  console.log(`  ✓ ${DRINK_GROUPS.length} drink groups upserted`)
}
