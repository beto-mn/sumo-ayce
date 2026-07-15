import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type KidsItem = {
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  /** Per-item price override; defaults to the standard $149 combo price. */
  price?: string
  /**
   * Splits the Kids view into two sub-sections: `true` → "All You Can Eat Kids"
   * (the $179 buffet), `false`/undefined → "Combo Infantil" (the $149 combos).
   */
  includedInAyce?: boolean
  featured?: boolean
}

// ─── KIDS MENU ──────────────────────────────────────────────────────────────
// The Kids view is a cross-cutting standalone menu type (NOT a food category
// inside AYCE or Express). Items carry `locationType='both'` for data coherence,
// but they are surfaced ONLY via the dedicated Kids query (by category), never in
// the AYCE/Express food lists. The 6 combos are $149 each; each combo includes
// french fries (100g), soda (400ml), sushi kids (5 pcs) and yakimeshi (240g). The
// "All You Can Eat Kids" item is the $179 kids buffet.

/** Kids items are stored with location scope 'both' (surfaced via the Kids view). */
export const KIDS_LOCATION_TYPE = 'both' as const
/** Standard combo price. */
export const KIDS_PRICE = '149.00' as const
/** All You Can Eat Kids price. */
export const KIDS_AYCE_PRICE = '179.00' as const

export const KIDS_ITEMS: KidsItem[] = [
  {
    nameEs: 'All You Can Eat Kids',
    nameEn: 'All You Can Eat Kids',
    descriptionEs:
      'Buffet all you can eat para niños de 2 a 10 años. Precio por persona, promoción individual (no para compartir). Rollos y alitas se sirven de 5 piezas; los demás platillos en porciones individuales. Máximo 2 platillos por persona a la vez. Solo para consumo en restaurante.',
    descriptionEn:
      'All you can eat buffet for children ages 2 to 10. Price per person, individual promotion (not for sharing). Rolls and wings are served in portions of 5 pieces; all other dishes in individual portions. Maximum 2 dishes per person at a time. Dine-in only.',
    fileName: null,
    price: KIDS_AYCE_PRICE,
    includedInAyce: true,
  },
  {
    nameEs: 'Kid Burger',
    nameEn: 'Kid Burger',
    descriptionEs:
      '60g de carne smash con queso amarillo, lechuga y aderezo americano. Acompañado de papas a la francesa.',
    descriptionEn:
      '60g smash beef patty topped with an American cheese slice, lettuce and American dressing. Served with french fries.',
    fileName: 'menu/kids/kid_burger.webp',
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

  // Clear by category (not locationType) so a reseed is idempotent regardless of
  // the items' current location scope.
  await db.delete(menuItems).where(eq(menuItems.categoryId, catMap.kids))

  const rows = KIDS_ITEMS.map((item, i) => ({
    categoryId: catMap.kids,
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    locationType: KIDS_LOCATION_TYPE,
    price: item.price ?? KIDS_PRICE,
    includedInAyce: item.includedInAyce ?? false,
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
