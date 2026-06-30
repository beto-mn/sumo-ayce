import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type CategoryKey =
  | 'appetizers'
  | 'burgers'
  | 'burritos'
  | 'hot_dogs'
  | 'cold_rolls'
  | 'hot_rolls'
  | 'sweet_rolls'
  | 'wings'

type ExpressItem = {
  categoryKey: CategoryKey
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs?: string
  badgeEn?: string
  featured?: boolean
  requiresSauce?: boolean
}

// ─── APPETIZERS ───────────────────────────────────────────────────────────────

const APPETIZERS: ExpressItem[] = [
  {
    categoryKey: 'appetizers',
    nameEs: 'Yakimeshi Mixto',
    nameEn: 'Mixed Yakimeshi',
    descriptionEs:
      'Arroz frito con pollo, res, huevo, verduras mixtas, cebollín picado y semillas de ajonjolí. 240 g.',
    descriptionEn:
      'Fried rice with chicken, beef, egg, mixed vegetables, freshly chopped green onions and sesame seeds. 240 g.',
    fileName: 'menu/express/mixed_yakimeshi.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Yakimeshi Especial',
    nameEn: 'Special Yakimeshi',
    descriptionEs:
      'Arroz frito con pollo, res, huevo, aguacate, queso crema, salchicha y cebollín picado. 250 g.',
    descriptionEn:
      'Fried rice with chicken, beef, egg, avocado, cream cheese, sausage and freshly chopped green onions. 250 g.',
    fileName: 'menu/express/special_yakimeshi.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Gohan Teriyaki',
    nameEn: 'Gohan Teriyaki',
    descriptionEs: 'Arroz blanco al vapor con pollo teriyaki. 240 g.',
    descriptionEn: 'Steamed white rice topped with teriyaki chicken. 240 g.',
    fileName: 'menu/express/gohan_teriyaki.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Gohan Especial',
    nameEn: 'Special Gohan',
    descriptionEs:
      'Arroz al vapor con queso crema, espinaca, zanahoria y cebollín picado. 240 g.',
    descriptionEn:
      'Steamed rice topped with cream cheese, spinach, carrot and freshly chopped green onions. 240 g.',
    fileName: 'menu/express/special_gohan.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas a la Francesa Con o Sin Queso',
    nameEn: 'French Fries With or Without Cheese',
    descriptionEs: 'Papas a la francesa con o sin queso. 200 g.',
    descriptionEn: 'French fries with or without cheese. 200 g.',
    fileName: 'menu/express/french_fries.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas Smash',
    nameEn: 'Smash Fries',
    descriptionEs:
      'Papas smash, carne smash, cebolla caramelizada, aderezo americano y cebollín picado. 300 g.',
    descriptionEn:
      'Smash fries, smash beef, caramelized onions, American dressing and freshly chopped green onions. 300 g.',
    fileName: 'menu/express/smash_fries.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Ramen',
    nameEn: 'Ramen',
    descriptionEs:
      'Sopa de ramen con caldo de pollo, verduras, yema de huevo y salsa de soya. 200 g.',
    descriptionEn:
      'Brothy ramen noodles with chicken broth, vegetables, egg yolk and soy sauce. 200 g.',
    fileName: 'menu/express/ramen.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Mac & Cheese',
    nameEn: 'Mac & Cheese',
    descriptionEs:
      'Pasta espiral en salsa de queso cremoso, cebollín picado. 240 g.',
    descriptionEn:
      'Pasta spirals in creamy cheese sauce, freshly chopped green onions. 240 g.',
    fileName: 'menu/express/mac_and_cheese.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Ensalada Sweet Kani',
    nameEn: 'Sweet Kani Salad',
    descriptionEs:
      'Kani fresco, mezcla de lechugas, tomate, vinagreta de la casa y semillas de ajonjolí tostadas. 180 g.',
    descriptionEn:
      'Fresh kani, mixed greens, tomato, house vinaigrette and toasted sesame seeds. 180 g.',
    fileName: 'menu/express/sweet_kani_salad.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Yabai Tempura',
    nameEn: 'Yasai Tempura',
    descriptionEs:
      'Verduras frescas fritas en tempura ligera, servidas con salsa teriyaki o a elección: naranja japonesa o habanero-piña. 120 g.',
    descriptionEn:
      'Fresh mixed vegetables in a light tempura batter, served with teriyaki sauce or your choice of Japanese orange or habanero-pineapple sauce. 120 g.',
    fileName: 'menu/express/yasai_tempura.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Sweet Corns',
    nameEn: 'Sweet Corns',
    descriptionEs:
      'Deliciosas pepitas de elote blanco y maíz mixto en salsa chipotle-piña. 150 g.',
    descriptionEn:
      'Delicious nibbles of white corn and mixed corn in chipotle-pineapple sauce. 150 g.',
    fileName: 'menu/express/sweet_corns.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Cinema Nachos',
    nameEn: 'Cinema Nachos',
    descriptionEs:
      'Totopos crujientes cubiertos con frijoles, queso y guacamole. 300 g.',
    descriptionEn: 'Crunchy nachos topped with beans, cheese and guac. 300 g.',
    fileName: 'menu/express/cinema_nachos.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Aros de Cebolla',
    nameEn: 'Onion Rings',
    descriptionEs:
      'Aros de cebolla fritos en salsa habanero-mango o jalapeño-queso. 90 g.',
    descriptionEn:
      'Fried onion rings in habanero-mango or jalapeño-cheese sauce. 90 g.',
    fileName: 'menu/express/onion_rings.webp',
  },
]

// ─── SMASH BURGERS ────────────────────────────────────────────────────────────

const BURGERS: ExpressItem[] = [
  {
    categoryKey: 'burgers',
    nameEs: 'Burger Clásica',
    nameEn: 'Classic Burger',
    descriptionEs:
      '80g de carne smash con queso, lechuga, cebolla roja, aderezo americano y pepinillos.',
    descriptionEn:
      '80g smash beef topped with cheese, lettuce, red onion, American dressing and pickles.',
    fileName: 'menu/express/classic_burger.webp',
    badgeEs: 'Make it Double +$79',
    badgeEn: 'Make it Double +$79',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Pulled Pork Burger',
    nameEn: 'Pulled Pork Burger',
    descriptionEs: 'Pulled pork bañado en salsa BBQ.',
    descriptionEn: 'A pulled pork coated in BBQ sauce.',
    fileName: 'menu/express/pulled_pork_burger.webp',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Burger del Barrio',
    nameEn: 'Barrio Burger',
    descriptionEs:
      '80g de carne smash con queso americano, salchicha, piña, tocino, lechuga y salsa BBQ.',
    descriptionEn:
      '80g smash beef with American cheese, sausage, pineapple, bacon, lettuce and BBQ sauce.',
    fileName: 'menu/express/barrio_burger.webp',
    badgeEs: 'Make it Double +$79',
    badgeEn: 'Make it Double +$79',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Spicy Smash',
    nameEn: 'Spicy Smash',
    descriptionEs:
      'Smash picoso con jalapeño, cebolla crujiente, chile serrano y aderezo de chile-tomate.',
    descriptionEn:
      'A spicy smash with jalapeño, crispy onion, serrano pepper and chile-tomato dressing.',
    fileName: 'menu/express/spicy_smash.webp',
    badgeEs: 'Make it Double +$79',
    badgeEn: 'Make it Double +$79',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Guacamole Burger',
    nameEn: 'Guacamole Burger',
    descriptionEs:
      '80g de carne smash con queso, cebolla caramelizada, guacamole, jalapeño y salsa BBQ.',
    descriptionEn:
      '80g smash beef topped with cheese, caramelized onions, guacamole, jalapeño and BBQ sauce.',
    fileName: 'menu/express/guacamole_burger.webp',
    badgeEs: 'Make it Double +$79',
    badgeEn: 'Make it Double +$79',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'BBQ Burger',
    nameEn: 'BBQ Burger',
    descriptionEs:
      '80g de carne smash con cheddar, tocino, lechuga y salsa BBQ.',
    descriptionEn:
      '80g smash beef topped with cheddar, bacon, lettuce and BBQ sauce.',
    fileName: 'menu/express/bbq_burger.webp',
    badgeEs: 'Make it Double +$79',
    badgeEn: 'Make it Double +$79',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Spicy Chicken Burger',
    nameEn: 'Spicy Chicken Burger',
    descriptionEs:
      'Burger de pollo con lechuga, jalapeño sauce y aderezo serrano.',
    descriptionEn:
      'Chicken burger with lettuce, jalapeño sauce and serrano dressing.',
    fileName: 'menu/express/spicy_chicken_burger.webp',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Chicken Cheese Burger',
    nameEn: 'Chicken Cheese Burger',
    descriptionEs:
      '80g de tender de pollo con lechuga, salsa de queso y aderezo americano.',
    descriptionEn:
      '80g chicken tender topped with lettuce, cheese sauce and American dressing.',
    fileName: 'menu/express/chicken_cheese_burger.webp',
  },
]

// ─── BURRITOS ─────────────────────────────────────────────────────────────────

const BURRITOS: ExpressItem[] = [
  {
    categoryKey: 'burritos',
    nameEs: 'Pulled Pork Burrito',
    nameEn: 'Pulled Pork Burrito',
    descriptionEs:
      '180g de pulled pork con vegetales, queso y salsa BBQ. 1 pz.',
    descriptionEn:
      '180g pulled pork with vegetables, cheese and BBQ sauce. 1 pc.',
    fileName: 'menu/express/pulled_pork_burrito.webp',
  },
  {
    categoryKey: 'burritos',
    nameEs: 'Tender Burrito',
    nameEn: 'Tender Burrito',
    descriptionEs:
      '80g de tender de pollo en salsa original, queso azul y vegetales. 1 pz.',
    descriptionEn:
      '80g chicken tender in original sauce, blue cheese and vegetables. 1 pc.',
    fileName: 'menu/express/tender_burrito.webp',
  },
]

// ─── HOT DOGS ─────────────────────────────────────────────────────────────────

const HOT_DOGS: ExpressItem[] = [
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Jumbo Sumo Dog',
    nameEn: 'Jumbo Sumo Dog',
    descriptionEs: 'Hot dog completo servido con cebollín y salsa BBQ. 1 pz.',
    descriptionEn:
      'A whole hot dog served with green onions and BBQ sauce. 1 pc.',
    fileName: 'menu/express/jumbo_sumo_dog.webp',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Buffalo Ranch Dog',
    nameEn: 'Buffalo Ranch Dog',
    descriptionEs:
      'Hot dog con aderezo americano, salsa Buffalo y ranch. 1 pz.',
    descriptionEn:
      'Hot dog with American dressing, Buffalo sauce and ranch. 1 pc.',
    fileName: 'menu/express/buffalo_ranch_dog.webp',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Smash Dog',
    nameEn: 'Smash Dog',
    descriptionEs:
      'Hot dog con carne smash, mostaza amarilla, cebolla crujiente, jalapeño sauce y aderezo americano. 1 pz.',
    descriptionEn:
      'Hot dog topped with smash beef, yellow mustard, crispy onion, jalapeño sauce and American dressing. 1 pc.',
    fileName: 'menu/express/smash_dog.webp',
  },
]

// ─── COLD SUSHI ROLLS (5 pcs) ─────────────────────────────────────────────────

const COLD_ROLLS: ExpressItem[] = [
  {
    categoryKey: 'cold_rolls',
    nameEs: 'White Dragon',
    nameEn: 'White Dragon',
    descriptionEs:
      'Por dentro: pepino, aguacate, filete de pescado. Por fuera: queso crema, tempura crunch, ajonjolí y salsa sweet chili. 5 pzs.',
    descriptionEn:
      'Inside: cucumber, avocado, fish fillet. Outside: cream cheese, tempura crunch, sesame and sweet chili sauce. 5 pcs.',
    fileName: 'menu/express/white_dragon.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'California',
    nameEn: 'California',
    descriptionEs:
      'Por dentro: pepino, aguacate, filete de pescado. Por fuera: aguacate, ajonjolí tostado y mayo japonesa. 5 pzs.',
    descriptionEn:
      'Inside: cucumber, avocado, fish fillet. Outside: avocado, toasted sesame and Japanese mayo. 5 pcs.',
    fileName: 'menu/express/california.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Filadelfia',
    nameEn: 'Philadelphia',
    descriptionEs:
      'Por dentro: pepino, aguacate, filete de pescado. Por fuera: queso crema, ajonjolí y sweet chili. 5 pzs.',
    descriptionEn:
      'Inside: cucumber, avocado, fish fillet. Outside: cream cheese, sesame and sweet chili. 5 pcs.',
    fileName: 'menu/express/philadelphia.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Kyoto Roll',
    nameEn: 'Kyoto Roll',
    descriptionEs:
      'Por dentro: tuna spicy, pepino. Por fuera: aguacate, tempura crunch y salsa teriyaki dulce. 5 pzs.',
    descriptionEn:
      'Inside: spicy tuna, cucumber. Outside: avocado, tempura crunch and sweet teriyaki sauce. 5 pcs.',
    fileName: 'menu/express/kyoto.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Tokio Roll',
    nameEn: 'Tokio Roll',
    descriptionEs:
      'Por dentro: queso crema, pepino. Por fuera: filete de pescado, aguacate, ajonjolí, salsa sweet chili y mayo japonesa. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, cucumber. Outside: fish fillet, avocado, sesame, sweet chili sauce and Japanese mayo. 5 pcs.',
    fileName: 'menu/express/tokio.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Bora Bora',
    nameEn: 'Bora Bora',
    descriptionEs:
      'Por dentro: tuna spicy, queso crema. Por fuera: mango, ajonjolí y salsa sweet chili. 5 pzs.',
    descriptionEn:
      'Inside: spicy tuna, cream cheese. Outside: mango, sesame and sweet chili sauce. 5 pcs.',
    fileName: 'menu/express/bora_bora.webp',
  },
]

// ─── HOT SUSHI ROLLS (5 pcs) ──────────────────────────────────────────────────

const HOT_ROLLS: ExpressItem[] = [
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Rikishi Roll',
    nameEn: 'Rikishi Roll',
    descriptionEs:
      'Por dentro: queso crema, carne smash, jalapeño. Por fuera: queso crema, carne smash, empanizado y frito, bañado con salsa teriyaki y sriracha. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, smash beef, jalapeño. Outside: cream cheese, smash beef, breaded and fried, drizzled with teriyaki sauce and sriracha. 5 pcs.',
    fileName: 'menu/express/rikishi_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Kekoto',
    nameEn: 'Kekoto',
    descriptionEs:
      'Por dentro: queso crema, pepino. Por fuera: queso crema, empanizado y frito, cubierto con steak y habanero spicy. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, cucumber. Outside: cream cheese, breaded and fried, topped with steak and spicy habanero. 5 pcs.',
    fileName: 'menu/express/kekoto.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Banana Frie',
    nameEn: 'Banana Frie',
    descriptionEs:
      'Por dentro: queso crema, plátano. Por fuera: queso crema, empanizado y frito, cubierto con plátano y salsa sweet chili. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, banana. Outside: cream cheese, breaded and fried, topped with banana and sweet chili sauce. 5 pcs.',
    fileName: 'menu/express/banana_fried.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Sumo Roll',
    nameEn: 'Sumo Roll',
    descriptionEs:
      'Por dentro: aguacate, queso crema, atún. Por fuera: queso crema, empanizado y frito con masago y ajonjolí. 5 pzs.',
    descriptionEn:
      'Inside: avocado, cream cheese, tuna. Outside: cream cheese, breaded and fried with masago and sesame. 5 pcs.',
    fileName: 'menu/express/sumo_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Japan Roll',
    nameEn: 'Japan Roll',
    descriptionEs:
      'Por dentro: salmón spicy, queso crema. Por fuera: queso crema, empanizado y frito, con salmón y salsa especial. 5 pzs.',
    descriptionEn:
      'Inside: spicy salmon, cream cheese. Outside: cream cheese, breaded and fried, with salmon and special sauce. 5 pcs.',
    fileName: 'menu/express/japan.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Manchego Boll',
    nameEn: 'Manchego Roll',
    descriptionEs:
      'Por dentro: queso crema, jalapeño. Por fuera: queso crema, empanizado y frito, cubierto con salsa de queso manchego. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, jalapeño. Outside: cream cheese, breaded and fried, topped with manchego cheese sauce. 5 pcs.',
    fileName: 'menu/express/manchego_roll.webp',
  },
]

// ─── SWEET ROLLS (5 pcs) ──────────────────────────────────────────────────────

const SWEET_ROLLS: ExpressItem[] = [
  {
    categoryKey: 'sweet_rolls',
    nameEs: 'Canela Roll',
    nameEn: 'Cinnamon Roll',
    descriptionEs:
      'Por dentro: queso crema. Por fuera: queso crema, empanizado y frito, cubierto con dulce de leche, canela y azúcar glass. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese. Outside: cream cheese, breaded and fried, topped with dulce de leche, cinnamon and powdered sugar. 5 pcs.',
    fileName: 'menu/express/cinnamon_roll.webp',
  },
]

// ─── WINGS AND BONELESS ───────────────────────────────────────────────────────

const WINGS: ExpressItem[] = [
  {
    categoryKey: 'wings',
    nameEs: 'Alitas',
    nameEn: 'Chicken Wings',
    descriptionEs: '5 alitas de pollo con tu salsa a elegir.',
    descriptionEn: '5 chicken wings with your choice of sauce.',
    fileName: null,
    requiresSauce: true,
  },
  {
    categoryKey: 'wings',
    nameEs: 'Boneless',
    nameEn: 'Boneless',
    descriptionEs:
      '150g de pepitas de pollo empanizadas, bañadas en una de nuestras salsas.',
    descriptionEn:
      '150g breaded chicken bites, topped with your choice of sauce.',
    fileName: null,
    requiresSauce: true,
  },
]

// ─── All sections ordered as they appear in the menu ─────────────────────────

const ALL_ITEMS: ExpressItem[] = [
  ...APPETIZERS,
  ...BURGERS,
  ...BURRITOS,
  ...HOT_DOGS,
  ...COLD_ROLLS,
  ...HOT_ROLLS,
  ...SWEET_ROLLS,
  ...WINGS,
]

export async function seedExpressMenu() {
  console.log('  → Seeding Express menu items…')

  const cats = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)

  const catMap = Object.fromEntries(
    cats.map((c: { key: string; id: string }) => [c.key, c.id])
  )

  const requiredKeys: CategoryKey[] = [
    'appetizers',
    'burgers',
    'burritos',
    'hot_dogs',
    'cold_rolls',
    'hot_rolls',
    'sweet_rolls',
    'wings',
  ]

  for (const key of requiredKeys) {
    if (!catMap[key]) {
      throw new Error(
        `menuCategories row for key="${key}" not found — run menuCategories seed first`
      )
    }
  }

  // Delete existing express items for each relevant category
  const catIds = requiredKeys.map(k => catMap[k])
  await db
    .delete(menuItems)
    .where(
      and(
        inArray(menuItems.categoryId, catIds),
        eq(menuItems.locationType, 'express')
      )
    )

  const rows = ALL_ITEMS.map((item, i) => ({
    categoryId: catMap[item.categoryKey],
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    locationType: 'express' as const,
    price: null,
    includedInAyce: true,
    fileName: item.fileName ?? null,
    badgeEs: item.badgeEs ?? null,
    badgeEn: item.badgeEn ?? null,
    featured: item.featured ?? false,
    drinkGroup: null,
    requiresSauce: item.requiresSauce ?? false,
    isActive: true,
    displayOrder: i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} Express menu items inserted`)
}
