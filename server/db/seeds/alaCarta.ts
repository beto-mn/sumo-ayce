import { and, eq, inArray } from 'drizzle-orm'
import { db } from '../../utils/db'
import { menuCategories, menuItems } from '../schema'

type CategoryKey =
  | 'appetizers'
  | 'salads'
  | 'rice'
  | 'ramen'
  | 'burgers'
  | 'hot_dogs'
  | 'cold_rolls'
  | 'hot_rolls'
  | 'sweet_rolls'
  | 'wings'

type AlaCartaItem = {
  categoryKey: CategoryKey
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  fileName: string | null
  price: string | null
  badgeEs?: string
  badgeEn?: string
  featured?: boolean
  requiresSauce?: boolean
}

// ─── APPETIZERS ───────────────────────────────────────────────────────────────

const APPETIZERS: AlaCartaItem[] = [
  {
    categoryKey: 'appetizers',
    nameEs: 'Tender de Pollo',
    nameEn: 'Chicken Tenders',
    descriptionEs:
      'Tiras de pollo empanizadas, servidas con aderezo americano.',
    descriptionEn: 'Breaded chicken tenders served with American dressing.',
    fileName: 'menu/ala-carta/chicken_tenders.webp',
    featured: true,
    price: '128.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Yasai Tempura',
    nameEn: 'Yasai Tempura',
    descriptionEs:
      'Mix de vegetales frescos, rebozados en nuestra pasta tempura y fritos. Aderezo a elegir: mayonesa mango habanero o piña habanero.',
    descriptionEn:
      'Fresh mixed vegetables battered in our tempura and fried. Choice of dressing: mango habanero mayo or pineapple habanero.',
    fileName: 'menu/ala-carta/yasai_tempura.webp',
    price: '120.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas Smash',
    nameEn: 'Smash Fries',
    descriptionEs:
      'Papas a la francesa, carne smash, cebolla caramelizada, cebollín y aderezo americano.',
    descriptionEn:
      'French fries, smash beef, caramelized onion, green onion and American dressing.',
    fileName: 'menu/ala-carta/smash_fries.webp',
    price: '128.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Papas a la Francesa con o sin Queso',
    nameEn: 'French Fries with or without Cheese',
    descriptionEs: 'Papas a la francesa, con o sin queso.',
    descriptionEn: 'French fries with or without cheese.',
    fileName: 'menu/ala-carta/french_fries.webp',
    price: '119.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Camote Fries',
    nameEn: 'Sweet Potato Fries',
    descriptionEs: 'Papa camote frita, crujiente.',
    descriptionEn: 'Crispy sweet potato fries.',
    fileName: 'menu/ala-carta/sweet_potato_fries.webp',
    price: '128.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Aros de Cebolla',
    nameEn: 'Onion Rings',
    descriptionEs:
      'Aros de cebolla fritos en salsa habanero-mango o jalapeño-queso.',
    descriptionEn:
      'Fried onion rings with habanero-mango or jalapeño-cheese sauce.',
    fileName: 'menu/ala-carta/onion_rings.webp',
    price: '139.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Kushiage de Queso',
    nameEn: 'Cheese Kushiage',
    descriptionEs: 'Queso manchego empanizado en panko..',
    descriptionEn: 'Manchego cheese breaded in panko..',
    fileName: 'menu/ala-carta/cheese_kushiage.webp',
    price: '128.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Sweet Corns',
    nameEn: 'Sweet Corns',
    descriptionEs:
      'Deliciosas rodajas de elote fritas y sazonadas, acompañadas con salsa chipotle.',
    descriptionEn:
      'Delicious fried and seasoned corn slices served with chipotle sauce.',
    fileName: 'menu/ala-carta/sweet_corn.webp',
    price: '128.00',
  },
  {
    categoryKey: 'appetizers',
    nameEs: 'Cinema Nachos',
    nameEn: 'Cinema Nachos',
    descriptionEs:
      'Crujientes totopos bañados en queso fundido con chile jalapeño en cubos.',
    descriptionEn:
      'Crunchy nachos drenched in melted cheese with diced jalapeño.',
    fileName: 'menu/ala-carta/nachos.webp',
    price: '129.00',
  },
]

// ─── SALADS ───────────────────────────────────────────────────────────────────

const SALADS: AlaCartaItem[] = [
  {
    categoryKey: 'salads',
    nameEs: 'Ensalada César',
    nameEn: 'Caesar Salad',
    descriptionEs:
      'Tender de pollo o pechuga de pollo (120g), sobre base de lechuga italiana, jitomate, aguacate, queso parmesano, crutones y aderezo césar.',
    descriptionEn:
      'Romaine lettuce base, topped with chicken tenders or grilled chicken (120g), tomato, avocado, parmesan cheese, croutons and Caesar dressing.',
    fileName: 'menu/ala-carta/cesar_salad.webp',
    price: '145.00',
  },
  {
    categoryKey: 'salads',
    nameEs: 'Chicken Chick',
    nameEn: 'Chicken Chick',
    descriptionEs:
      'Tender de pollo o pechuga de pollo (120g), sobre base de lechuga italiana, jitomate, aguacate, queso parmesano, crutones y aderezo césar.',
    descriptionEn:
      'Romaine lettuce base, topped with chicken tenders (120g), tomato, tortilla strips, avocado, red onion, sesame seeds and blue cheese dressing.',
    fileName: 'menu/ala-carta/chicken_chick_salad.webp',
    price: '149.00',
  },
]

// ─── RICE DISHES ──────────────────────────────────────────────────────────────

const RICE_DISHES: AlaCartaItem[] = [
  {
    categoryKey: 'rice',
    nameEs: 'Yakimeshi Mixto',
    nameEn: 'Mixed Yakimeshi',
    descriptionEs:
      'Arroz a la plancha con pollo, carne de res, huevo, mix de vegetales, cebollín y ajonjolí.',
    descriptionEn:
      'Grilled rice with chicken, beef, egg, mixed vegetables, green onion and sesame.',
    fileName: 'menu/ala-carta/mixed_yakimeshi.webp',
    featured: true,
    price: '99.00',
  },
  {
    categoryKey: 'rice',
    nameEs: 'Yakimeshi Especial',
    nameEn: 'Special Yakimeshi',
    descriptionEs:
      'Arroz frito a la plancha con pollo, carne de res, huevo, aguacate, queso crema, mix de vegetales, tampico y cebollín.',
    descriptionEn:
      'Grilled fried rice with chicken, beef, egg, avocado, cream cheese, mixed vegetables, tampico and green onion.',
    fileName: 'menu/ala-carta/special_yakimeshi.webp',
    price: '109.00',
  },
  {
    categoryKey: 'rice',
    nameEs: 'Gohan Teriyaki',
    nameEn: 'Gohan Teriyaki',
    descriptionEs:
      'Arroz blanco al vapor, acompañado con pollo a la plancha en salsa teriyaki.',
    descriptionEn:
      'Steamed white rice served with grilled chicken in teriyaki sauce.',
    fileName: 'menu/ala-carta/gohan_tereyaki.webp',
    price: '99.00',
  },
  {
    categoryKey: 'rice',
    nameEs: 'Gohan Especial',
    nameEn: 'Special Gohan',
    descriptionEs:
      'Arroz blanco al vapor, aguacate, queso crema, tampico, surimi, ajonjolí y cebollín.',
    descriptionEn:
      'Steamed white rice with avocado, cream cheese, tampico, surimi, sesame and green onion.',
    fileName: 'menu/ala-carta/special_gohan.webp',
    price: '100.00',
  },
]

// ─── RAMEN ────────────────────────────────────────────────────────────────────

const RAMEN: AlaCartaItem[] = [
  {
    categoryKey: 'ramen',
    nameEs: 'Ramen XL',
    nameEn: 'Ramen XL',
    descriptionEs:
      'Ramen XL en caldo de tu elección, con proteína a elegir y toppings extras al gusto.',
    descriptionEn:
      'XL ramen in your choice of broth, with your choice of protein and extra toppings.',
    fileName: 'menu/ala-carta/ramen_xl.webp',
    featured: true,
    price: '149.00',
  },
]

// ─── SMASH BURGERS ────────────────────────────────────────────────────────────
// Combos — burger + papas a la francesa (100g) + refresco (400ml) × $239.
// Combo price goes on the page; individual price: null.

const BURGERS: AlaCartaItem[] = [
  {
    categoryKey: 'burgers',
    nameEs: 'Sumo',
    nameEn: 'Sumo',
    descriptionEs:
      'Hamburguesa con doble carne de res (300g), aderezo americano, queso manchego, lechuga y bañada en cualquiera de nuestras salsas.',
    descriptionEn:
      'Double beef burger (300g) with American dressing, manchego cheese and lettuce, topped with your choice of our sauces.',
    fileName: 'menu/ala-carta/sumo_burger.webp',
    featured: true,
    price: '239.00',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Buffalo Chicken',
    nameEn: 'Buffalo Chicken',
    descriptionEs:
      'Hamburguesa de tender de pollo (120g), aderezo americano, bañada con salsa original buffalo, lechuga, cebolla y aderezo de blue cheese.',
    descriptionEn:
      'Chicken tender burger (120g) with American dressing, original buffalo sauce, lettuce, onion and blue cheese dressing.',
    fileName: 'menu/ala-carta/buffalo_chicken_burger.webp',
    price: '239.00',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Piña Asada',
    nameEn: 'Grilled Pineapple',
    descriptionEs:
      'Hamburguesa de carne de res (150g), aderezo americano, queso manchego, cebolla caramelizada, piña asada, tocino miel y lechuga.',
    descriptionEn:
      'Beef burger (150g) with American dressing, manchego cheese, caramelized onion, grilled pineapple, honey bacon and lettuce.',
    fileName: 'menu/ala-carta/grilled_pineapple_burger.webp',
    price: '239.00',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Spicy Burger',
    nameEn: 'Spicy Burger',
    descriptionEs:
      'Hamburguesa de carne de res (150g), aderezo de chile toreado, tocino, aros de cebolla, queso manchego y blue cheese.',
    descriptionEn:
      'Beef burger (150g) with roasted chile dressing, bacon, onion rings, manchego cheese and blue cheese.',
    fileName: 'menu/ala-carta/spicy_burger.webp',
    price: '239.00',
  },
  {
    categoryKey: 'burgers',
    nameEs: 'Tostiburger',
    nameEn: 'Tostiburger',
    descriptionEs:
      'Hamburguesa de carne de res (150g) bañada en salsa de queso con tocino, base de guacamole, queso manchego, tocino miel y cebolla caramelizada, acompañada de nachos cinema.',
    descriptionEn:
      'Beef burger (150g) in cheese and bacon sauce over a guacamole base, with manchego cheese, honey bacon and caramelized onion, served with cinema nachos.',
    fileName: 'menu/ala-carta/tostiburger.webp',
    price: '239.00',
  },
]

// ─── HOT DOGS ─────────────────────────────────────────────────────────────────
// Combos — hot dog + papas a la francesa (100g) + refresco (400ml) × $239.

const HOT_DOGS: AlaCartaItem[] = [
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Buffalo Ranch Dog',
    nameEn: 'Buffalo Ranch Dog',
    descriptionEs:
      'Hot Dog Jumbo envuelto en tocino, aderezo americano, salsa Buffalo Ranch, papatinas fritas con sazonador cajún. 1 pz.',
    descriptionEn:
      'Jumbo hot dog wrapped in bacon with American dressing, Buffalo Ranch sauce and potato chips with cajun seasoning..',
    fileName: 'menu/ala-carta/buffalo_ranch_dog.webp',
    featured: true,
    price: '239.00',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Guacamole Dog',
    nameEn: 'Guacamole Dog',
    descriptionEs:
      'Hot Dog Jumbo con aderezo americano, guacamole y tocino. 1 pz.',
    descriptionEn:
      'Jumbo hot dog with American dressing, guacamole and bacon..',
    fileName: 'menu/ala-carta/guacamole_dog.webp',
    price: '239.00',
  },
  {
    categoryKey: 'hot_dogs',
    nameEs: 'Smash Dog',
    nameEn: 'Smash Dog',
    descriptionEs:
      'Hot Dog Jumbo envuelto en tocino, carne smash, con cebolla caramelizada, queso manchego y aderezo de chile toreado. 1 pz.',
    descriptionEn:
      'Jumbo hot dog wrapped in bacon and smash beef, with caramelized onion, manchego cheese and roasted chile dressing..',
    fileName: 'menu/ala-carta/smash_dog.webp',
    price: '239.00',
  },
]

// ─── COLD SUSHI ROLLS (10 pcs) ────────────────────────────────────────────────
// Combos — rollo + Yakimeshi Mixto o Ensalada Sweet Kani + refresco (400ml) × $179.

const COLD_ROLLS: AlaCartaItem[] = [
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Luna Roll',
    nameEn: 'Moon Roll',
    descriptionEs:
      'Por dentro: aguacate y pepino. Por fuera: mango, camarones rocca, pico de piña y salsa de chiltepín..',
    descriptionEn:
      'Inside: avocado and cucumber. Outside: mango, rocca shrimp, pineapple pico and chiltepín sauce..',
    fileName: 'menu/ala-carta/moon_roll.webp',
    featured: true,
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Bora Bora',
    nameEn: 'Bora Bora',
    descriptionEs:
      'Por dentro: queso crema, pepino y camarón empanizado. Por fuera: mango y salsa de anguila..',
    descriptionEn:
      'Inside: cream cheese, cucumber and breaded shrimp. Outside: mango and eel sauce..',
    fileName: 'menu/ala-carta/bora_bora.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'California',
    nameEn: 'California',
    descriptionEs:
      'Por dentro: surimi, aguacate y pepino. Por fuera: mix de ajonjolí..',
    descriptionEn:
      'Inside: surimi, avocado and cucumber. Outside: sesame mix..',
    fileName: 'menu/ala-carta/california.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Filadelfia',
    nameEn: 'Philadelphia',
    descriptionEs:
      'Por dentro: queso crema, aguacate y salmón. Por fuera: mix de ajonjolí..',
    descriptionEn:
      'Inside: cream cheese, avocado and salmon. Outside: sesame mix..',
    fileName: 'menu/ala-carta/philadelphia.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Monkey Roll',
    nameEn: 'Monkey Roll',
    descriptionEs:
      'Por dentro: aguacate, kakiage de zanahoria y queso crema. Por fuera: láminas de plátano macho, tampico y salsa de anguila..',
    descriptionEn:
      'Inside: avocado, carrot kakiage and cream cheese. Outside: plantain slices, tampico and eel sauce..',
    fileName: 'menu/ala-carta/monkey_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'White Dragon',
    nameEn: 'White Dragon',
    descriptionEs:
      'Por dentro: camarón empanizado, piña asada y aguacate. Por fuera: queso crema, condimento de camarón y salsa panthai..',
    descriptionEn:
      'Inside: breaded shrimp, grilled pineapple and avocado. Outside: cream cheese, shrimp seasoning and pad thai sauce..',
    fileName: 'menu/ala-carta/white_dragon.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Nipon Roll',
    nameEn: 'Nipon Roll',
    descriptionEs:
      'Por dentro: aguacate y surimi empanizado. Por fuera: queso manchego, guacamole, pico de piña y chile serrano..',
    descriptionEn:
      'Inside: avocado and breaded surimi. Outside: manchego cheese, guacamole, pineapple pico and serrano pepper..',
    fileName: 'menu/ala-carta/nipon_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'cold_rolls',
    nameEs: 'Tiki Thai Roll',
    nameEn: 'Tiki Thai Roll',
    descriptionEs:
      'Por dentro: camarón empanizado, pepino y piña. Por fuera: aguacate, ajonjolí y salsa panthai..',
    descriptionEn:
      'Inside: breaded shrimp, cucumber and pineapple. Outside: avocado, sesame and pad thai sauce..',
    fileName: 'menu/ala-carta/tiki_thai_roll.webp',
    price: '119.00',
  },
]

// ─── HOT SUSHI ROLLS (10 pcs) ─────────────────────────────────────────────────
// Combos — rollo + Yakimeshi Mixto o Ensalada Sweet Kani + refresco (400ml) × $179.

const HOT_ROLLS: AlaCartaItem[] = [
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Kekoto',
    nameEn: 'Kekoto',
    descriptionEs:
      'Por dentro: camarón empanizado, queso crema y aguacate. Por fuera: empanizado, tampico y mayonesa chipotle..',
    descriptionEn:
      'Inside: breaded shrimp, cream cheese and avocado. Outside: breaded with tampico and chipotle mayo..',
    fileName: 'menu/ala-carta/kekoto.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Coco Roll',
    nameEn: 'Coco Roll',
    descriptionEs:
      'Por dentro: aguacate, piña, queso crema y camarón empanizado. Por fuera: empanizado con panko y coco, bañado de salsa piña chiltepín. Sushi sin alga..',
    descriptionEn:
      'Inside: avocado, pineapple, cream cheese and breaded shrimp. Outside: panko and coconut breading, drizzled with chipotle-pineapple sauce. Seaweed-free..',
    fileName: 'menu/ala-carta/coco_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Sumo Roll',
    nameEn: 'Sumo Roll',
    descriptionEs:
      'Por dentro: aguacate, queso manchego y tender. Por fuera: empanizado y salsa de preferencia a escoger..',
    descriptionEn:
      'Inside: avocado, manchego cheese and chicken tender. Outside: breaded with your choice of sauce..',
    fileName: 'menu/ala-carta/sumo_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Rikishi Roll',
    nameEn: 'Rikishi Roll',
    descriptionEs:
      'Por dentro: base de arroz frito, queso crema y camarón empanizado. Por fuera: alga nori empanizado y bañado en salsa de anguila..',
    descriptionEn:
      'Inside: fried rice base, cream cheese and breaded shrimp. Outside: breaded nori seaweed drizzled with eel sauce..',
    fileName: 'menu/ala-carta/rikishi_roll.webp',
    featured: true,
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Más de lo Mismo',
    nameEn: 'More of the Same',
    descriptionEs:
      'Por dentro: base de arroz frito, camarón empanizado y aguacate. Por fuera: empanizado, queso crema, tampico, chile serrano bañado en salsa de anguila..',
    descriptionEn:
      'Inside: fried rice base, breaded shrimp and avocado. Outside: breaded, cream cheese, tampico and serrano pepper drizzled with eel sauce..',
    fileName: 'menu/ala-carta/more_of_the_same.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Tempura Roll',
    nameEn: 'Tempura Roll',
    descriptionEs:
      'Por dentro: aguacate y camarón empanizado. Por fuera: empanizado, queso manchego, mayonesa chipotle, salsa de anguila y cebollín. Sushi sin alga..',
    descriptionEn:
      'Inside: avocado and breaded shrimp. Outside: breaded with manchego cheese, chipotle mayo, eel sauce and green onion. Seaweed-free..',
    fileName: 'menu/ala-carta/tempura_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Texas Roll',
    nameEn: 'Texas Roll',
    descriptionEs:
      'Por dentro: carne de res, manchego, aguacate, chile serrano y cebollín. Por fuera: empanizado, tiritas de papas fritas, mayonesa chipotle y salsa BBQ..',
    descriptionEn:
      'Inside: beef, manchego, avocado, serrano pepper and green onion. Outside: breaded with french fry strips, chipotle mayo and BBQ sauce..',
    fileName: 'menu/ala-carta/texas_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Manchego Roll',
    nameEn: 'Manchego Roll',
    descriptionEs:
      'Por dentro: queso crema, aguacate, surimi empanizado, kakiage de zanahoria. Por fuera: queso manchego derretido con chiles toreados y cebollín. Sushi sin alga..',
    descriptionEn:
      'Inside: cream cheese, avocado, breaded surimi and carrot kakiage. Outside: melted manchego cheese with roasted chiles and green onion. Seaweed-free..',
    fileName: 'menu/ala-carta/manchego_roll.webp',
    price: '119.00',
  },
  {
    categoryKey: 'hot_rolls',
    nameEs: 'Banana Frie',
    nameEn: 'Banana Frie',
    descriptionEs:
      'Por dentro: queso crema y surimi. Por fuera: plátano macho frito y salsa de anguila..',
    descriptionEn:
      'Inside: cream cheese and surimi. Outside: fried plantain and eel sauce..',
    fileName: 'menu/ala-carta/banana_fried_roll.webp',
    price: '119.00',
  },
]

// ─── SWEET ROLLS (10 pcs) ─────────────────────────────────────────────────────

const SWEET_ROLLS: AlaCartaItem[] = [
  {
    categoryKey: 'sweet_rolls',
    nameEs: 'Canela Roll',
    nameEn: 'Cinnamon Roll',
    descriptionEs:
      'Por dentro: queso crema y plátano macho. Por fuera: tempura dulce, espolvoreado con azúcar y canela. Bañado en salsa de chocolate..',
    descriptionEn:
      'Inside: cream cheese and plantain. Outside: sweet tempura dusted with sugar and cinnamon, drizzled with chocolate sauce..',
    fileName: 'menu/ala-carta/cinnamon_roll.webp',
    featured: true,
    price: '119.00',
  },
  {
    categoryKey: 'sweet_rolls',
    nameEs: 'Beach Roll',
    nameEn: 'Beach Roll',
    descriptionEs:
      'Por dentro: queso crema y mango. Por fuera: plátano macho. Bañado en salsa de chocolate..',
    descriptionEn:
      'Inside: cream cheese and mango. Outside: plantain, drizzled with chocolate sauce..',
    fileName: 'menu/ala-carta/beach_roll.webp',
    price: '119.00',
  },
]

// ─── WINGS AND BONELESS — PACKAGES ───────────────────────────────────────────

const WINGS: AlaCartaItem[] = [
  {
    categoryKey: 'wings',
    nameEs: 'Alitas Paquete Individual',
    nameEn: 'Wings Individual Pack',
    descriptionEs:
      '10 alitas de pollo con 1 aderezo (45ml) y 2 salsas a elegir (45ml c/u).',
    descriptionEn:
      '10 chicken wings with 1 dressing (45ml) and 2 sauces of your choice (45ml each).',
    fileName: null,
    price: '229.00',
    requiresSauce: true,
  },
  {
    categoryKey: 'wings',
    nameEs: 'Alitas Paquete para Compartir',
    nameEn: 'Wings Sharing Pack',
    descriptionEs:
      '20 alitas de pollo con 1 aderezo (45ml), de papas a la francesa, vegetales (70g) y 3 salsas a elegir (45ml c/u).',
    descriptionEn:
      '20 chicken wings with 1 dressing (45ml), french fries, vegetables (70g) and 3 sauces of your choice (45ml each).',
    fileName: null,
    price: '409.00',
    requiresSauce: true,
  },
  {
    categoryKey: 'wings',
    nameEs: 'Boneless Paquete Individual',
    nameEn: 'Boneless Individual Pack',
    descriptionEs:
      'Trocitos de pechuga de pollo bañados en 2 salsas de tu preferencia (45ml c/u), acompañados con papas a la francesa (100g)..',
    descriptionEn:
      '12 breaded chicken bites in 2 sauces of your choice (45ml each), served with french fries (100g).',
    fileName: null,
    price: '279.00',
    requiresSauce: true,
  },
  {
    categoryKey: 'wings',
    nameEs: 'Boneless Paquete para Compartir',
    nameEn: 'Boneless Sharing Pack',
    descriptionEs:
      'Trocitos de pechuga de pollo bañados en 3 salsas de tu preferencia (45ml c/u), acompañados con papas a la francesa (200g)..',
    descriptionEn:
      '30 breaded chicken bites in 3 sauces of your choice (45ml each), served with french fries (200g).',
    fileName: null,
    price: '579.00',
    requiresSauce: true,
  },
]

// ─── All items ────────────────────────────────────────────────────────────────

const ALL_ITEMS: AlaCartaItem[] = [
  ...APPETIZERS,
  ...SALADS,
  ...RICE_DISHES,
  ...RAMEN,
  ...BURGERS,
  ...HOT_DOGS,
  ...COLD_ROLLS,
  ...HOT_ROLLS,
  ...SWEET_ROLLS,
  ...WINGS,
]

export async function seedAlaCarta() {
  console.log('  → Seeding à la carte menu…')

  const cats = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)

  const catMap = Object.fromEntries(
    cats.map((c: { key: string; id: string }) => [c.key, c.id])
  )

  const requiredKeys: CategoryKey[] = [
    'appetizers',
    'salads',
    'rice',
    'ramen',
    'burgers',
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

  // Delete existing à la carte items for affected categories (includedInAyce: false only —
  // does NOT touch AYCE included items, desserts, or kids menu).
  const catIds = requiredKeys.map(k => catMap[k])
  await db
    .delete(menuItems)
    .where(
      and(
        inArray(menuItems.categoryId, catIds),
        eq(menuItems.locationType, 'ayce'),
        eq(menuItems.includedInAyce, false)
      )
    )

  const rows = ALL_ITEMS.map((item, i) => ({
    categoryId: catMap[item.categoryKey],
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
    requiresSauce: item.requiresSauce ?? false,
    isActive: true,
    displayOrder: i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} à la carte items inserted`)
}
