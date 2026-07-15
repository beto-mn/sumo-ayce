import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type CategoryKey =
  | 'appetizers'
  | 'burgers'
  | 'sandwiches'
  | 'hot_dogs'
  | 'cold_rolls'
  | 'hot_rolls'
  | 'sweet_rolls'
  | 'wings'

type AyceItem = {
  categoryKey: CategoryKey
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  badgeEs?: string
  badgeEn?: string
  featured?: boolean
  /** Explicit rail order when featured (Garantías Sumo). */
  featuredOrder?: number
  requiresSauce?: boolean
}

// ─── APPETIZERS ───────────────────────────────────────────────────────────────

const APPETIZERS: AyceItem[] = [
  {
    categoryKey: 'appetizers',
    nameEs: 'Yakimeshi Mixto',
    nameEn: 'Mixed Yakimeshi',
    descriptionEs:
      'Arroz a la plancha con pollo, carne de res, huevo, mix de vegetales, cebollín y ajonjolí.',
    descriptionEn:
      'Grilled rice with chicken, beef, egg, mixed vegetables, green onion and sesame.',
    fileName: 'menu/ayce/mixed_yakimeshi.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Yakimeshi Especial',
    nameEn: 'Special Yakimeshi',
    descriptionEs:
      'Arroz frito a la plancha con pollo, carne de res, huevo, aguacate, queso crema, mix de vegetales, tampico y cebollín.',
    descriptionEn:
      'Grilled fried rice with chicken, beef, egg, avocado, cream cheese, mixed vegetables, tampico and green onion.',
    fileName: 'menu/ayce/special_yakimeshi.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Gohan Teriyaki',
    nameEn: 'Gohan Teriyaki',
    descriptionEs:
      'Arroz blanco al vapor, acompañado con pollo a la plancha en salsa teriyaki.',
    descriptionEn:
      'Steamed white rice served with grilled chicken in teriyaki sauce.',
    fileName: 'menu/ayce/gohan_teriyaki.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Gohan Especial',
    nameEn: 'Special Gohan',
    descriptionEs:
      'Arroz blanco al vapor, aguacate, queso crema, tampico, surimi, ajonjolí y cebollín.',
    descriptionEn:
      'Steamed white rice with avocado, cream cheese, tampico, surimi, sesame and green onion.',
    fileName: 'menu/ayce/special_gohan.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas a la Francesa Con o Sin Queso',
    nameEn: 'French Fries With or Without Cheese',
    descriptionEs: 'Papas a la francesa, con o sin queso.',
    descriptionEn: 'French fries with or without cheese.',
    fileName: 'menu/ayce/french_fries.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas Smash',
    nameEn: 'Smash Fries',
    descriptionEs:
      'Papas a la francesa, carne smash, cebolla caramelizada, cebollín y aderezo americano.',
    descriptionEn:
      'French fries, smash beef, caramelized onion, green onion and American dressing.',
    fileName: 'menu/ayce/smash_fries.webp',
    featured: true,
    featuredOrder: 1,
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Ramen',
    nameEn: 'Ramen',
    descriptionEs:
      'Base de pasta ramen en caldo de vegetales picante en tamaño XL.',
    descriptionEn: 'Ramen noodles in spicy vegetable broth, XL size.',
    fileName: 'menu/ayce/ramen.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Mac & Cheese',
    nameEn: 'Mac & Cheese',
    descriptionEs:
      'Pasta en salsa de queso, tocino, cebollín y jalapeños en vinagre.',
    descriptionEn:
      'Pasta in cheese sauce with bacon, green onion and pickled jalapeños.',
    fileName: 'menu/ayce/mac_and_cheese.webp',
    featured: true,
    featuredOrder: 2,
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Ensalada Sweet Kani',
    nameEn: 'Sweet Kani Salad',
    descriptionEs:
      'Ensalada con pepino, mango, aguacate, lechuga, surimi, mix de ajonjolí y bañada con vinagreta de la casa.',
    descriptionEn:
      'Salad with cucumber, mango, avocado, lettuce, surimi, sesame mix and house vinaigrette.',
    fileName: 'menu/ayce/sweet_kani_salad.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Yasai Tempura',
    nameEn: 'Yasai Tempura',
    descriptionEs:
      'Mix de vegetales frescos, rebozados en nuestra pasta tempura y fritos. Aderezo a elegir: mayonesa mango habanero o piña habanero.',
    descriptionEn:
      'Fresh mixed vegetables battered in our tempura and fried. Choice of dressing: mango habanero mayo or pineapple habanero.',
    fileName: 'menu/ayce/yasai_tempura.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Sweet Corns',
    nameEn: 'Sweet Corns',
    descriptionEs:
      'Deliciosas rodajas de elote fritas y sazonadas, acompañadas con salsa chipotle.',
    descriptionEn:
      'Delicious fried and seasoned corn slices served with chipotle sauce.',
    fileName: 'menu/ayce/sweet_corns.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Cinema Nachos',
    nameEn: 'Cinema Nachos',
    descriptionEs:
      'Crujientes totopos bañados en queso fundido con chile jalapeño en cubos.',
    descriptionEn:
      'Crunchy nachos drenched in melted cheese with diced jalapeño.',
    fileName: 'menu/ayce/cinema_nachos.webp',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Kushiage de Queso',
    nameEn: 'Cheese Kushiage',
    descriptionEs: 'Queso manchego empanizado en panko.',
    descriptionEn: 'Manchego cheese breaded in panko.',
    fileName: 'menu/ayce/cheese_kushiage.webp',
    featured: true,
    featuredOrder: 7,
  },
]

// ─── SMASH BURGERS ────────────────────────────────────────────────────────────

const BURGERS: AyceItem[] = [
  {
    categoryKey: 'burgers',
    nameEs: 'Burger Clásica',
    nameEn: 'Classic Burger',
    descriptionEs:
      '60g de carne smash con queso amarillo, lechuga, cebolla morada y aderezo americano.',
    descriptionEn:
      '60g smash beef with yellow cheese, lettuce, red onion and American dressing.',
    fileName: 'menu/ayce/classic_burger.webp',
    badgeEs: 'Doble o triple carne',
    badgeEn: 'Double or triple meat',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Pulled Pork Burger',
    nameEn: 'Pulled Pork Burger',
    descriptionEs: '70g de carne de cerdo deshebrada bañada en salsa BBQ.',
    descriptionEn: '70g pulled pork drizzled with BBQ sauce.',
    fileName: 'menu/ayce/pulled_pork_burger.webp',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Burger del Barrio',
    nameEn: 'Barrio Burger',
    descriptionEs:
      '60g de carne smash con queso amarillo, salchicha, piña, tocino, lechuga y aderezo americano.',
    descriptionEn:
      '60g smash beef with yellow cheese, sausage, pineapple, bacon, lettuce and American dressing.',
    fileName: 'menu/ayce/barrio_burger.webp',
    badgeEs: 'Doble o triple carne',
    badgeEn: 'Double or triple meat',
    featured: true,
    featuredOrder: 0,
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Guacamole Burger',
    nameEn: 'Guacamole Burger',
    descriptionEs:
      '60g de carne smash con queso manchego, cebolla caramelizada, guacamole, Doritos Nacho® y salsa de queso.',
    descriptionEn:
      '60g smash beef with manchego cheese, caramelized onion, guacamole, Doritos Nacho® and cheese sauce.',
    fileName: 'menu/ayce/guacamole_burger.webp',
    badgeEs: 'Doble o triple carne',
    badgeEn: 'Double or triple meat',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Spicy Smash',
    nameEn: 'Spicy Smash',
    descriptionEs:
      '60g de carne smash con queso amarillo, cebolla caramelizada, chile serrano y aderezo de chile toreado.',
    descriptionEn:
      '60g smash beef with yellow cheese, caramelized onion, serrano pepper and roasted chile dressing.',
    fileName: 'menu/ayce/spicy_smash.webp',
    badgeEs: 'Doble o triple carne',
    badgeEn: 'Double or triple meat',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'BBQ Burger',
    nameEn: 'BBQ Burger',
    descriptionEs:
      '60g de tender de pollo con queso amarillo, aros de cebolla, tocino, lechuga, bañado en salsa BBQ.',
    descriptionEn:
      '60g chicken tender with yellow cheese, onion rings, bacon, lettuce, drizzled with BBQ sauce.',
    fileName: 'menu/ayce/bbq_burger.webp',
    badgeEs: 'Doble o triple carne',
    badgeEn: 'Double or triple meat',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Spicy Chicken Burger',
    nameEn: 'Spicy Chicken Burger',
    descriptionEs:
      '60g de tender de pollo, tocino miel, lechuga, aderezo americano.',
    descriptionEn:
      '60g chicken tender with honey bacon, lettuce and American dressing.',
    fileName: 'menu/ayce/spicy_chicken_burger.webp',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Chicken Cheese Burger',
    nameEn: 'Chicken Cheese Burger',
    descriptionEs:
      '60g de tender de pollo con lechuga, queso manchego, cebolla morada y aderezo americano.',
    descriptionEn:
      '60g chicken tender with lettuce, manchego cheese, red onion and American dressing.',
    fileName: 'menu/ayce/chicken_cheese_burger.webp',
  },
]

// ─── SANDWICHES ───────────────────────────────────────────────────────────────

const SANDWICHES: AyceItem[] = [
  {
    categoryKey: 'sandwiches',
    nameEs: 'Sumo Sándwich de Camarón',
    nameEn: 'Shrimp Sumo Sandwich',
    descriptionEs:
      'Sándwich a base de arroz y empanizado, relleno de alga nori, queso crema, aguacate y camarón, bañado en mayonesa chipotle y mix de ajonjolí.',
    descriptionEn:
      'Rice and breaded sandwich filled with nori seaweed, cream cheese, avocado and shrimp, drizzled with chipotle mayo and sesame mix.',
    fileName: 'menu/ayce/sandwich_shrimp.webp',
  },
  {
    categoryKey: 'sandwiches',
    nameEs: 'Sumo Sándwich de Surimi',
    nameEn: 'Surimi Sumo Sandwich',
    descriptionEs:
      'Sándwich a base de arroz y empanizado, relleno de alga nori, queso crema, aguacate y surimi, bañado en mayonesa chipotle y mix de ajonjolí.',
    descriptionEn:
      'Rice and breaded sandwich filled with nori seaweed, cream cheese, avocado and surimi, drizzled with chipotle mayo and sesame mix.',
    fileName: 'menu/ayce/sandwich_surimi.webp',
  },
  {
    categoryKey: 'sandwiches',
    nameEs: 'Sumo Sándwich de Salmón',
    nameEn: 'Salmon Sumo Sandwich',
    descriptionEs:
      'Sándwich a base de arroz y empanizado, relleno de alga nori, queso crema, aguacate y salmón, bañado en mayonesa chipotle y mix de ajonjolí.',
    descriptionEn:
      'Rice and breaded sandwich filled with nori seaweed, cream cheese, avocado and salmon, drizzled with chipotle mayo and sesame mix.',
    fileName: 'menu/ayce/sandwich_salmon.webp',
  },
]

// ─── HOT DOGS ─────────────────────────────────────────────────────────────────

const HOT_DOGS: AyceItem[] = [
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Jumbo Sumo Dog',
    nameEn: 'Jumbo Sumo Dog',
    descriptionEs: 'Hot Dog Jumbo con cebollas y pimientos a la BBQ. 1 pz.',
    descriptionEn: 'Jumbo hot dog with BBQ onions and peppers..',
    fileName: 'menu/ayce/jumbo_sumo_dog.webp',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Buffalo Ranch Dog',
    nameEn: 'Buffalo Ranch Dog',
    descriptionEs:
      'Hot Dog con aderezo americano, salsa Buffalo Ranch, papatinas fritas con sazonador cajún. 1 pz.',
    descriptionEn:
      'Hot dog with American dressing, Buffalo Ranch sauce and potato chips with cajun seasoning..',
    fileName: 'menu/ayce/buffalo_ranch_dog.webp',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Smash Dog',
    nameEn: 'Smash Dog',
    descriptionEs:
      'Hot Dog Jumbo envuelto en tocino, carne smash, con cebolla caramelizada, queso manchego y aderezo de chile toreado. 1 pz.',
    descriptionEn:
      'Jumbo hot dog wrapped in bacon and smash beef, with caramelized onion, manchego cheese and roasted chile dressing..',
    fileName: 'menu/ayce/smash_dog.webp',
    featured: true,
    featuredOrder: 3,
  },
]

// ─── COLD SUSHI ROLLS (5 pcs) ─────────────────────────────────────────────────

const COLD_ROLLS: AyceItem[] = [
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Bora Bora',
    nameEn: 'Bora Bora',
    descriptionEs:
      'Por dentro: queso crema, pepino y camarón empanizado. Por fuera: mango y salsa de anguila. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, cucumber and breaded shrimp. Outside: mango and eel sauce..',
    fileName: 'menu/ayce/bora_bora.webp',
    featured: true,
    featuredOrder: 4,
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'White Dragon',
    nameEn: 'White Dragon',
    descriptionEs:
      'Por dentro: camarón empanizado, piña asada y aguacate. Por fuera: queso crema, empanizado de camarón y salsa panthai. 5 pzs.',
    descriptionEn:
      'Inside: breaded shrimp, grilled pineapple and avocado. Outside: cream cheese, shrimp breading and pad thai sauce..',
    fileName: 'menu/ayce/white_dragon.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Tiki Thai Roll',
    nameEn: 'Tiki Thai Roll',
    descriptionEs:
      'Por dentro: camarón empanizado, pepino y piña. Por fuera: aguacate, empanizado de camarón y bañado en pico de piña y salsa de chiltepin. 5 pzs.',
    descriptionEn:
      'Inside: breaded shrimp, cucumber and pineapple. Outside: avocado, shrimp breading drizzled with pineapple pico and chiltepin sauce..',
    fileName: 'menu/ayce/tiki_thai_roll.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Filadelfia',
    nameEn: 'Philadelphia',
    descriptionEs:
      'Por dentro: queso crema, pepino y jalapeño. Por fuera: mix de ajonjolí. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, cucumber and jalapeño. Outside: sesame mix..',
    fileName: 'menu/ayce/philadelphia.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Nipon Roll',
    nameEn: 'Nipon Roll',
    descriptionEs:
      'Por dentro: aguacate y surimi empanizado. Por fuera: queso manchego, guacamole, pico de piña y chile serrano. 5 pzs.',
    descriptionEn:
      'Inside: avocado and breaded surimi. Outside: manchego cheese, guacamole, pineapple pico and serrano pepper..',
    fileName: 'menu/ayce/nipon_roll.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Luna Roll',
    nameEn: 'Moon Roll',
    descriptionEs:
      'Por dentro: aguacate y pepino. Por fuera: mango, camarones rocca, pico de piña y salsa de chiltepin. 5 pzs.',
    descriptionEn:
      'Inside: avocado and cucumber. Outside: mango, rocca shrimp, pineapple pico and chiltepin sauce..',
    fileName: 'menu/ayce/moon_roll.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'California',
    nameEn: 'California',
    descriptionEs:
      'Por dentro: surimi, aguacate y pepino. Por fuera: mix de ajonjolí. 5 pzs.',
    descriptionEn:
      'Inside: surimi, avocado and cucumber. Outside: sesame mix..',
    fileName: 'menu/ayce/california.webp',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Monkey Roll',
    nameEn: 'Monkey Roll',
    descriptionEs:
      'Por dentro: aguacate, kakeage de zanahoria y queso crema. Por fuera: láminas de queso manchego, tampico y salsa de anguila. 5 pzs.',
    descriptionEn:
      'Inside: avocado, carrot kakeage and cream cheese. Outside: manchego cheese slices, tampico and eel sauce..',
    fileName: 'menu/ayce/monkey_roll.webp',
  },
]

// ─── HOT SUSHI ROLLS (5 pcs) ──────────────────────────────────────────────────

const HOT_ROLLS: AyceItem[] = [
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Rikishi Roll',
    nameEn: 'Rikishi Roll',
    descriptionEs:
      'Por dentro: base de arroz frito, queso crema y camarón empanizado. Por fuera: alga nori empanizado y bañado en salsa de anguila. 5 pzs.',
    descriptionEn:
      'Inside: fried rice base, cream cheese and breaded shrimp. Outside: breaded nori seaweed drizzled with eel sauce..',
    fileName: 'menu/ayce/rikishi_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Kekoto',
    nameEn: 'Kekoto',
    descriptionEs:
      'Por dentro: camarón empanizado, queso crema y aguacate. Por fuera: empanizado, tampico y mayonesa chipotle. 5 pzs.',
    descriptionEn:
      'Inside: breaded shrimp, cream cheese and avocado. Outside: breaded with tampico and chipotle mayo..',
    fileName: 'menu/ayce/kekoto.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Banana Frie',
    nameEn: 'Banana Frie',
    descriptionEs:
      'Por dentro: queso crema y plátano macho. Por fuera: plátano macho frito y salsa de anguila. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese and plantain. Outside: fried plantain and eel sauce..',
    fileName: 'menu/ayce/banana_fried.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Sumo Roll',
    nameEn: 'Sumo Roll',
    descriptionEs:
      'Por dentro: aguacate, queso manchego y tampico. Por fuera: empanizado y salsa de preferencia a escoger. 5 pzs.',
    descriptionEn:
      'Inside: avocado, manchego cheese and tampico. Outside: breaded with your choice of sauce..',
    fileName: 'menu/ayce/sumo_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Texas Roll',
    nameEn: 'Texas Roll',
    descriptionEs:
      'Por dentro: carne de res, manchego, aguacate, chile serrano y cebollín. Por fuera: empanizado, tiritas de papas fritas, mayonesa chipotle y salsa BBQ. 5 pzs.',
    descriptionEn:
      'Inside: beef, manchego cheese, avocado, serrano pepper and green onion. Outside: breaded with french fry strips, chipotle mayo and BBQ sauce..',
    fileName: 'menu/ayce/texas_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Más de Lo Mismo',
    nameEn: 'More of the Same',
    descriptionEs:
      'Por dentro: base de arroz frito, camarón empanizado y aguacate. Por fuera: empanizado, queso crema, tampico, chile serrano bañado en salsa de anguila. 5 pzs.',
    descriptionEn:
      'Inside: fried rice base, breaded shrimp and avocado. Outside: breaded, cream cheese, tampico and serrano pepper drizzled with eel sauce..',
    fileName: 'menu/ayce/more_of_the_same.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Coco Roll',
    nameEn: 'Coco Roll',
    descriptionEs:
      'Por dentro: aguacate, piña, queso crema y camarón empanizado. Por fuera: empanizado con panko y coco, bañado de salsa piña chipoltepin. Sushi sin alga. 5 pzs.',
    descriptionEn:
      'Inside: avocado, pineapple, cream cheese and breaded shrimp. Outside: panko and coconut breading, drizzled with chipotle-pineapple sauce. Seaweed-free..',
    fileName: 'menu/ayce/coco_roll.webp',
    featured: true,
    featuredOrder: 5,
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Tempura Roll',
    nameEn: 'Tempura Roll',
    descriptionEs:
      'Por dentro: aguacate y camarón empanizado. Por fuera: empanizado, mayonesa chipotle, salsa de anguila y cebollín. Sushi sin alga. 5 pzs.',
    descriptionEn:
      'Inside: avocado and breaded shrimp. Outside: breaded with chipotle mayo, eel sauce and green onion. Seaweed-free..',
    fileName: 'menu/ayce/tempura_roll.webp',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Manchego Roll',
    nameEn: 'Manchego Roll',
    descriptionEs:
      'Por dentro: queso crema, surimi empanizado, kakeage de zanahoria. Por fuera: queso manchego derretido con chiles toreados y cebollín. Sushi sin alga. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese, breaded surimi and carrot kakeage. Outside: melted manchego cheese with roasted chiles and green onion. Seaweed-free..',
    fileName: 'menu/ayce/manchego_roll.webp',
  },
]

// ─── SWEET ROLLS (5 pcs) ──────────────────────────────────────────────────────

const SWEET_ROLLS: AyceItem[] = [
  {
    categoryKey: 'sweet_rolls',
    nameEs: 'Canela Roll',
    nameEn: 'Cinnamon Roll',
    descriptionEs:
      'Por dentro: queso crema y plátano macho. Por fuera: tempura dulce, espolvoreado con azúcar y canela. Bañado en salsa de chocolate. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese and plantain. Outside: sweet tempura dusted with sugar and cinnamon, drizzled with chocolate sauce..',
    fileName: 'menu/ayce/cinnamon_roll.webp',
    featured: true,
    featuredOrder: 6,
  },
  {
    categoryKey: 'sweet_rolls',
    nameEs: 'Beach Roll',
    nameEn: 'Beach Roll',
    descriptionEs:
      'Por dentro: queso crema y mango. Por fuera: plátano macho. Bañado en salsa de chocolate. 5 pzs.',
    descriptionEn:
      'Inside: cream cheese and mango. Outside: plantain, drizzled with chocolate sauce..',
    fileName: 'menu/ayce/beach_roll.webp',
  },
]

// ─── WINGS AND BONELESS ───────────────────────────────────────────────────────

const WINGS: AyceItem[] = [
  {
    categoryKey: 'wings',
    nameEs: 'Alitas',
    nameEn: 'Chicken Wings',
    descriptionEs: '5 alitas de pollo con una salsa a elegir.',
    descriptionEn: '5 chicken wings with your choice of sauce.',
    fileName: null,
  },
  {
    categoryKey: 'wings',
    nameEs: 'Boneless',
    nameEn: 'Boneless',
    descriptionEs:
      '150g de trocitos de pollo empanizados y bañados en una de nuestras salsas.',
    descriptionEn: '150g breaded chicken bites topped with one of our sauces.',
    fileName: null,
  },
]

// ─── All sections ordered as they appear in the menu ─────────────────────────

export const ALL_ITEMS: AyceItem[] = [
  ...APPETIZERS,
  ...BURGERS,
  ...SANDWICHES,
  ...HOT_DOGS,
  ...COLD_ROLLS,
  ...HOT_ROLLS,
  ...SWEET_ROLLS,
  ...WINGS,
]

export async function seedAyceMenu() {
  console.log('  → Seeding AYCE menu items…')

  const cats = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)

  const catMap = Object.fromEntries(
    cats.map((c: { key: string; id: string }) => [c.key, c.id])
  )

  const requiredKeys: CategoryKey[] = [
    'appetizers',
    'burgers',
    'sandwiches',
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

  // Delete existing AYCE items for each relevant category
  const catIds = requiredKeys.map(k => catMap[k])
  await db
    .delete(menuItems)
    .where(
      and(
        inArray(menuItems.categoryId, catIds),
        eq(menuItems.locationType, 'ayce')
      )
    )

  const rows = ALL_ITEMS.map((item, i) => ({
    categoryId: catMap[item.categoryKey],
    nameEs: item.nameEs,
    nameEn: item.nameEn,
    descriptionEs: item.descriptionEs,
    descriptionEn: item.descriptionEn,
    locationType: 'ayce' as const,
    price: null,
    includedInAyce: true,
    fileName: item.fileName ?? null,
    badgeEs: item.badgeEs ?? null,
    badgeEn: item.badgeEn ?? null,
    featured: item.featured ?? false,
    drinkGroup: null,
    requiresSauce: item.requiresSauce ?? false,
    isActive: true,
    displayOrder: item.featuredOrder ?? i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} AYCE menu items inserted`)
}
