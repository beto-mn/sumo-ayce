import { and, eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type KidsItem = {
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string
  featured?: boolean
}

// ─── KIDS COMBO ───────────────────────────────────────────────────────────────
// À la carte — not included in AYCE, $149 per combo.
// Each option includes: french fries (100g), soda (400ml), sushi kids (5 pcs)
// and yakimeshi (240g). Child picks one main dish from the list below.

const KIDS_ITEMS: KidsItem[] = [
  {
    nameEs: 'Kid Burger',
    nameEn: 'Kid Burger',
    descriptionEs:
      '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
    descriptionEn:
      '60g smash beef patty topped with an American cheese slice, lettuce and American dressing. Served with french fries.',
    fileName: 'menu/kids/kid_burger.webp',
    featured: true,
  },
  {
    nameEs: 'Sushi Kids',
    nameEn: 'Sushi Kids',
    descriptionEs:
      '5 pzas de cualquier rollo de nuestra carta y un yakimeshi (240g).',
    descriptionEn: 'Any sushi roll from our menu (5 pcs) and Yakimeshi (240g).',
    fileName: 'menu/kids/sushi_kids.webp',
  },
  {
    nameEs: 'Chicken Kids',
    nameEn: 'Chicken Kids',
    descriptionEs: '120g Tender de pollo, acompañado de papas a la francesa.',
    descriptionEn: '120g chicken tender, served with french fries.',
    fileName: 'menu/kids/chicken_kids.webp',
  },
  {
    nameEs: 'Mac & Cheese',
    nameEn: 'Mac & Cheese',
    descriptionEs: '240g Pasta en salsa de queso, tocino y cebollín.',
    descriptionEn:
      '240g Macaroni in creamy cheese sauce, bacon and finely chopped green onions.',
    fileName: 'menu/kids/mac_&_cheese.webp',
  },
  {
    nameEs: 'Kawaii Pizza de Queso',
    nameEn: 'Kawaii Cheese Pizza',
    descriptionEs:
      '300g Pizza con salsa de tomate, mezcla de quesos y papas a la francesa.',
    descriptionEn:
      '300g pizza with tomato sauce and a mix of cheeses, served with french fries.',
    fileName: 'menu/kids/kawaii_cheese_pizza.webp',
  },
  {
    nameEs: 'Kawaii Pizza de Pepperoni',
    nameEn: 'Kawaii Pepperoni Pizza',
    descriptionEs:
      '300g Pizza con salsa de tomate, pepperoni, mezcla de quesos y papas a la francesa.',
    descriptionEn:
      '300g pizza with tomato sauce, pepperoni, a mix of cheeses, served with french fries.',
    fileName: 'menu/kids/kawai_pepperoni_pizza.webp',
  },
]

export async function seedKidsMenu() {
  console.log('  → Seeding kids menu…')

  const cats = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)

  const catMap = Object.fromEntries(
    cats.map((c: { key: string; id: string }) => [c.key, c.id])
  )

  if (!catMap.kids) {
    throw new Error(
      'menuCategories row for key="kids" not found — run menuCategories seed first'
    )
  }

  await db
    .delete(menuItems)
    .where(
      and(
        eq(menuItems.categoryId, catMap.kids),
        eq(menuItems.locationType, 'ayce')
      )
    )

  const rows = KIDS_ITEMS.map((item, i) => ({
    categoryId: catMap.kids,
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    locationType: 'ayce' as const,
    price: '149.00',
    includedInAyce: false,
    fileName: item.fileName,
    badgeEs: null,
    badgeEn: null,
    featured: item.featured ?? false,
    drinkGroup: null,
    requiresSauce: false,
    isActive: true,
    displayOrder: i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} kids menu items inserted`)
}
