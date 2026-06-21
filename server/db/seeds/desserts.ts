import { and, eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type DessertItem = {
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string
  price: string
  badgeEs?: string
  badgeEn?: string
  featured?: boolean
}

// ─── POSTRES / DESSERTS ───────────────────────────────────────────────────────
// À la carte — not included in AYCE, charged separately.

const DESSERTS: DessertItem[] = [
  {
    nameEs: 'Sumo Fries',
    nameEn: 'Sumo Fries',
    descriptionEs:
      'Papa camote frita, tocino maple, acompañado de helado de vainilla.',
    descriptionEn:
      'Sweet potato fries topped with maple bacon dressing and served with vanilla ice cream.',
    fileName: 'sumo_fries_dessert.webp',
    price: '149.00',
  },
  {
    nameEs: 'Camelado',
    nameEn: 'Camelado',
    descriptionEs:
      'Gelatina de café con crema de licor de café y brandy, acompañado de helado de vainilla, chocolate líquido y crema batida.',
    descriptionEn:
      'Coffee jelly with coffee liqueur and brandy, served with vanilla ice cream, drizzled with chocolate sauce and topped with whipped cream.',
    fileName: 'camelado.webp',
    price: '109.00',
    badgeEs: 'Contiene alcohol +18 años',
    badgeEn: 'Made with alcohol (+18 only)',
  },
  {
    nameEs: 'Sumo Bites',
    nameEn: 'Sumo Bites',
    descriptionEs:
      'Centro de dona, espolvoreado con azúcar y canela, bañados en salsa de chocolate, acompañado de helado de vainilla y crema batida.',
    descriptionEn:
      'Donut holes, sprinkled with sugar and cinnamon, served with vanilla ice cream, drizzled with chocolate sauce and topped with whipped cream.',
    fileName: 'sumo_bites.webp',
    price: '129.00',
  },
  {
    nameEs: 'Cheesecake de Oreo',
    nameEn: 'Oreo Cheesecake',
    descriptionEs:
      'Rebanada de cheesecake de Oreo, en una base de chocolate líquido, decorado con polvo de galleta Oreo.',
    descriptionEn:
      'Oreo cheesecake slice, served on a melted chocolate base and sprinkled with Oreo cookie crumbs.',
    fileName: 'oreo_cheesecake.webp',
    price: '149.00',
  },
  {
    nameEs: 'Pastel Conejo Turin',
    nameEn: 'Turin Cake',
    descriptionEs:
      'Rebanada de pastel de Conejo Turin, en una base de chocolate líquido, decorado con polvo de galleta Oreo.',
    descriptionEn:
      'Cake slice made with "Conejo Turin" chocolate, served on a melted chocolate base and sprinkled with Oreo cookie crumbs.',
    fileName: 'turin_cake.webp',
    price: '149.00',
  },
]

export async function seedDesserts() {
  console.log('  → Seeding desserts…')

  const cats = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)

  const catMap = Object.fromEntries(
    cats.map((c: { key: string; id: string }) => [c.key, c.id])
  )

  if (!catMap.desserts) {
    throw new Error(
      'menuCategories row for key="postres" not found — run menuCategories seed first'
    )
  }

  await db
    .delete(menuItems)
    .where(
      and(
        eq(menuItems.categoryId, catMap.desserts),
        eq(menuItems.locationType, 'ayce')
      )
    )

  const rows = DESSERTS.map((item, i) => ({
    categoryId: catMap.desserts,
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    locationType: 'ayce' as const,
    price: item.price,
    includedInAyce: false,
    fileName: item.fileName,
    badgeEs: item.badgeEs ?? null,
    badgeEn: item.badgeEn ?? null,
    featured: item.featured ?? false,
    drinkGroup: null,
    requiresSauce: false,
    isActive: true,
    displayOrder: i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} desserts inserted`)
}
