import { eq } from 'drizzle-orm'
import { db } from '../../utils/db'
import {
  drinkGroups,
  drinkSubGroups,
  menuCategories,
  menuItems,
} from '../schema'

type DrinkGroup =
  | 'jumbo_cocktails'
  | 'cantaritos_sumo_cups'
  | 'non_alcoholic'
  | 'sodas'
  | 'coffee_digestifs'
  | 'beers_spirits'

type DrinkSeed = {
  nameEs: string
  nameEn: string
  descriptionEs: string
  descriptionEn: string
  price: string
  drinkGroup: DrinkGroup
  drinkSubGroupKey?: string
  fileName?: string
  badgeEs?: string
  badgeEn?: string
  featured?: boolean
}

// ─── COCTELERÍA JUMBO (BEBIDAS_02) ──────────────────────────────────────────
// 960 ml cada uno — all 6 have individual photos

const JUMBO_COCKTAILS: DrinkSeed[] = [
  {
    nameEs: 'Sangría Sumo',
    nameEn: 'Sumo Sangria',
    descriptionEs:
      'Vodka (90 ml), vino tinto, jugo de limón, refresco sangría escarchado con pulpa de Pelón.',
    descriptionEn:
      'Vodka (90 ml), red wine, lime juice, sangria soda rimmed with Pelón candy.',
    price: '139.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'sumo_sangria.webp',
  },
  {
    nameEs: 'Margacheve',
    nameEn: 'Margacheve',
    descriptionEs:
      'Margarita frozen con 60 ml de tequila, escarchada de chamoy, con la cerveza de tu elección. Cervezas a elegir: Indio, Tecate, Tecate light, XX Ambar, XX Lager o Sol. Sabores a elegir: fresa, mango, tamarindo, maracuyá y mora.',
    descriptionEn:
      'Frozen margarita with 60 ml tequila, chamoy rim, with your choice of beer. Beers: Indio, Tecate, Tecate Light, XX Ambar, XX Lager or Sol. Flavors: strawberry, mango, tamarind, passion fruit and blackberry.',
    price: '169.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'margacheve.webp',
    badgeEs: 'Sabor + cerveza a elegir',
    badgeEn: 'Choose flavor + beer',
  },
  {
    nameEs: 'Limonada Eléctrica',
    nameEn: 'Electric Lemonade',
    descriptionEs: 'Limonada con jugo de naranja, curazao y vodka (90 ml).',
    descriptionEn: 'Lemonade with orange juice, curaçao and vodka (90 ml).',
    price: '139.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'electric_lemonade.webp',
  },
  {
    nameEs: 'Baby Sumo',
    nameEn: 'Baby Sumo',
    descriptionEs:
      'Bacardí Rapsberry (90 ml), jugo de arándano, refresco ameyal, escarchado con pica fresa.',
    descriptionEn:
      'Bacardí Rapsberry (90 ml), cranberry juice, ameyal soda, strawberry candy rim.',
    price: '149.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'baby_sumo.webp',
  },
  {
    nameEs: 'Mojito',
    nameEn: 'Mojito',
    descriptionEs:
      'Clásico mojito con ron (90 ml) y hierbabuena. Elige uno de nuestros sabores: limón, fresa, mora, mango, maracuyá o tamarindo.',
    descriptionEn:
      'Classic mojito with rum (90 ml) and mint. Choose your flavor: lemon, strawberry, blackberry, mango, passion fruit or tamarind.',
    price: '149.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'mojito.webp',
    badgeEs: 'Sabor a elegir',
    badgeEn: 'Choose your flavor',
  },
  {
    nameEs: 'Asumito',
    nameEn: 'Asumito',
    descriptionEs:
      'Vodka Skyy (90 ml), jugo de limón, Sprite, bebida de mora azul y jarabe natural.',
    descriptionEn:
      'Vodka Skyy (90 ml), lime juice, Sprite, blue blackberry drink and natural syrup.',
    price: '149.00',
    drinkGroup: 'jumbo_cocktails',
    fileName: 'asumito.webp',
  },
]

// ─── CANTARITO FEST + VASO SUMO + TROPICAL SUMO (BEBIDAS_06) ─────────────────
// Cantarito Fest, Vaso Sumo cup, and Tropical Sumo all use sumo_cup.webp

const CANTARITOS: DrinkSeed[] = [
  {
    nameEs: 'Cantarito Fest',
    nameEn: 'Cantarito Fest',
    descriptionEs:
      'Jarrito Cantarito de 750 ml a base de NEW MIX con 1 oz de Tequila Reposado, jugo de limón y naranja, escarchado con tajín. Sabores a elegir: Clásico, Frutos Rojos, Guayaba, Piña o Jamaica.',
    descriptionEn:
      '750 ml cantarito jar with NEW MIX and 1 oz Reposado Tequila, lime and orange juice, tajín rim. Flavors: Classic, Red Fruits, Guava, Pineapple or Hibiscus.',
    price: '155.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'cantarito.webp',
    badgeEs: 'Sabor a elegir',
    badgeEn: 'Choose your flavor',
  },
  {
    nameEs: 'Vaso Sumo Ron',
    nameEn: 'Sumo Cup Rum',
    descriptionEs:
      'Bebida preparada con mezclador en vaso SUMO 960 ml. 120 ml de Bacardí blanco.',
    descriptionEn:
      'Drink prepared with mixer in SUMO cup 960 ml. 120 ml Bacardí Blanco.',
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
  },
  {
    nameEs: 'Vaso Sumo Tequila',
    nameEn: 'Sumo Cup Tequila',
    descriptionEs:
      'Bebida preparada con mezclador en vaso SUMO 960 ml. 120 ml de Jose Cuervo Especial.',
    descriptionEn:
      'Drink prepared with mixer in SUMO cup 960 ml. 120 ml Jose Cuervo Especial.',
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
  },
  {
    nameEs: 'Vaso Sumo Vodka',
    nameEn: 'Sumo Cup Vodka',
    descriptionEs:
      'Bebida preparada con mezclador en vaso SUMO 960 ml. 120 ml de Skyy.',
    descriptionEn:
      'Drink prepared with mixer in SUMO cup 960 ml. 120 ml Skyy Vodka.',
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
  },
  {
    nameEs: 'Vaso Sumo Whisky',
    nameEn: 'Sumo Cup Whisky',
    descriptionEs:
      'Bebida preparada con mezclador en vaso SUMO 960 ml. 120 ml de Black and White.',
    descriptionEn:
      'Drink prepared with mixer in SUMO cup 960 ml. 120 ml Black and White Whisky.',
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
  },
  {
    nameEs: 'Vaso New Mix',
    nameEn: 'New Mix Cup',
    descriptionEs:
      'Vaso SUMO 960 ml con 120 ml de New Mix (elige entre pikosito o paloma). Servido con 2 latas de New Mix de 355 ml.',
    descriptionEn:
      'SUMO cup 960 ml with 120 ml New Mix (choose pikosito or paloma). Served with 2 New Mix cans of 355 ml.',
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
    badgeEs: 'Pikosito o paloma',
    badgeEn: 'Pikosito or Paloma',
  },
  {
    nameEs: "Vaso Jack Daniel's",
    nameEn: "Jack Daniel's Cup",
    descriptionEs:
      "Vaso SUMO 960 ml con 120 ml de Jack Daniel's (elige entre mineral, ginger o manzana). Servido con 2 latas de Jack Daniel's de 355 ml.",
    descriptionEn:
      "SUMO cup 960 ml with 120 ml Jack Daniel's (choose mineral, ginger or apple). Served with 2 Jack Daniel's cans of 355 ml.",
    price: '159.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
    badgeEs: 'Mineral, ginger o manzana',
    badgeEn: 'Mineral, ginger or apple',
  },
  {
    nameEs: 'Tropical Sumo',
    nameEn: 'Tropical Sumo',
    descriptionEs:
      'Malibú, Ron Bacardí blanco, pulpa de mandarina, jugo de arándano, jugo de limón y jarabe natural en vaso SUMO 960 ml.',
    descriptionEn:
      'Malibú, Bacardí white rum, mandarin pulp, cranberry juice, lime juice and natural syrup in SUMO cup 960 ml.',
    price: '169.00',
    drinkGroup: 'cantaritos_sumo_cups',
    fileName: 'sumo_cup.webp',
  },
]

// ─── BEBIDAS SIN ALCOHOL (BEBIDAS_05) ─────────────────────────────────────────
// All 6 have individual photos

const NON_ALCOHOLIC: DrinkSeed[] = [
  {
    nameEs: 'Piñada',
    nameEn: 'Piñada',
    descriptionEs: 'Piña colada sin alcohol. 440 ml.',
    descriptionEn: 'Non-alcoholic piña colada. 440 ml.',
    price: '79.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'piñada.webp',
    badgeEs: 'Jumbo $139 | +alcohol $164',
    badgeEn: 'Jumbo $139 | +alcohol $164',
  },
  {
    nameEs: 'Bora Bora',
    nameEn: 'Bora Bora',
    descriptionEs: 'Jugo de piña, jugo de maracuyá, limón, granadina. 440 ml.',
    descriptionEn:
      'Pineapple juice, passion fruit juice, lime, grenadine. 440 ml.',
    price: '79.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'bora_bora.webp',
    badgeEs: 'Jumbo $139 | +alcohol $164',
    badgeEn: 'Jumbo $139 | +alcohol $164',
  },
  {
    nameEs: 'Punch',
    nameEn: 'Punch',
    descriptionEs:
      'Mezcla de jugos de arándano, manzana, limón, granadina. 440 ml.',
    descriptionEn:
      'Blend of cranberry, apple, lime juice and grenadine. 440 ml.',
    price: '79.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'punch.webp',
    badgeEs: 'Jumbo $139 | +alcohol $164',
    badgeEn: 'Jumbo $139 | +alcohol $164',
  },
  {
    nameEs: 'Iceberg Lemon',
    nameEn: 'Iceberg Lemon',
    descriptionEs:
      'Flotante de limón, jugo de uva, refresco de limón, almíbar de cereza y granadina. 960 ml.',
    descriptionEn:
      'Lemon float, grape juice, lemon soda, cherry syrup and grenadine. 960 ml.',
    price: '139.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'iceberg_lemon.webp',
    badgeEs: '+$25 vino tinto (300 ml)',
    badgeEn: '+$25 red wine (300 ml)',
  },
  {
    nameEs: 'Sakura Fresa',
    nameEn: 'Sakura Strawberry',
    descriptionEs:
      'Flotante de fresa, jugo de limón, cereza, jarabe, hierbabuena y refresco de limón. 960 ml.',
    descriptionEn:
      'Strawberry float, lime juice, cherry, syrup, mint and lemon soda. 960 ml.',
    price: '139.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'sakura_fresa.webp',
    badgeEs: '+$25 ron (90 ml)',
    badgeEn: '+$25 rum (90 ml)',
  },
  {
    nameEs: 'Lychee Cooler',
    nameEn: 'Lychee Cooler',
    descriptionEs:
      'Flotante de lychee, jugo de arándano, jugo de limón, jarabe y refresco de kiwi. 960 ml.',
    descriptionEn:
      'Lychee float, cranberry juice, lime juice, syrup and kiwi soda. 960 ml.',
    price: '139.00',
    drinkGroup: 'non_alcoholic',
    fileName: 'lychee_cooler.webp',
    badgeEs: '+$25 vodka (90 ml)',
    badgeEn: '+$25 vodka (90 ml)',
  },
]

// ─── REFRESCOS Y BEBIDAS (BEBIDAS_03) ─────────────────────────────────────────
// Text-only list in the menu — no individual photos

const SODAS: DrinkSeed[] = [
  {
    nameEs: 'Refresco',
    nameEn: 'Soda',
    descriptionEs: '355 ml.',
    descriptionEn: '355 ml.',
    price: '69.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Refresco Jumbo',
    nameEn: 'Jumbo Soda',
    descriptionEs: '960 ml.',
    descriptionEn: '960 ml.',
    price: '129.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Té Helado',
    nameEn: 'Iced Tea',
    descriptionEs: '600 ml.',
    descriptionEn: '600 ml.',
    price: '69.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Agua Embotellada',
    nameEn: 'Bottled Water',
    descriptionEs: '600 ml.',
    descriptionEn: '600 ml.',
    price: '59.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Limonada Mineral',
    nameEn: 'Sparkling Lemonade',
    descriptionEs: '440 ml.',
    descriptionEn: '440 ml.',
    price: '59.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Naranjada Mineral',
    nameEn: 'Sparkling Orangeade',
    descriptionEs: '440 ml.',
    descriptionEn: '440 ml.',
    price: '59.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Limonada Jumbo',
    nameEn: 'Jumbo Sparkling Lemonade',
    descriptionEs:
      'Limonada mineral de sabores: fresa, tamarindo, mora, maracuyá, limón y naranja. 960 ml.',
    descriptionEn:
      'Sparkling lemonade, flavors: strawberry, tamarind, blackberry, passion fruit, lemon and orange. 960 ml.',
    price: '99.00',
    drinkGroup: 'sodas',
    badgeEs: 'Sabor a elegir',
    badgeEn: 'Choose your flavor',
  },
  {
    nameEs: 'Jarra de Limonada o Naranjada Mineral',
    nameEn: 'Sparkling Lemonade or Orangeade Pitcher',
    descriptionEs: '1.9 L.',
    descriptionEn: '1.9 L.',
    price: '199.00',
    drinkGroup: 'sodas',
  },
  {
    nameEs: 'Jarra de Jugo',
    nameEn: 'Juice Pitcher',
    descriptionEs: 'Uva, naranja, piña o manzana. 1.9 L.',
    descriptionEn: 'Grape, orange, pineapple or apple. 1.9 L.',
    price: '199.00',
    drinkGroup: 'sodas',
    badgeEs: 'Sabor a elegir',
    badgeEn: 'Choose your flavor',
  },
]

// ─── CAFÉ Y DIGESTIVOS (BEBIDAS_03) ───────────────────────────────────────────
// Café americano, espresso and bunny shot are text-only; carajillos have photos

const COFFEE_DIGESTIFS: DrinkSeed[] = [
  {
    nameEs: 'Café Americano',
    nameEn: 'Americano Coffee',
    descriptionEs: '270 ml.',
    descriptionEn: '270 ml.',
    price: '59.00',
    drinkGroup: 'coffee_digestifs',
  },
  {
    nameEs: 'Espresso',
    nameEn: 'Espresso',
    descriptionEs: '60 ml.',
    descriptionEn: '60 ml.',
    price: '49.00',
    drinkGroup: 'coffee_digestifs',
  },
  {
    nameEs: 'Bunny Shot',
    nameEn: 'Bunny Shot',
    descriptionEs: '145 ml.',
    descriptionEn: '145 ml.',
    price: '115.00',
    drinkGroup: 'coffee_digestifs',
  },
  {
    nameEs: 'Carajillo Mazapán',
    nameEn: 'Marzipan Carajillo',
    descriptionEs: 'Carajillo de mazapán. 240 ml.',
    descriptionEn: 'Marzipan carajillo. 240 ml.',
    price: '149.00',
    drinkGroup: 'coffee_digestifs',
    fileName: 'mazapan.webp',
  },
  {
    nameEs: 'Carajillo Clásico',
    nameEn: 'Classic Carajillo',
    descriptionEs: 'Carajillo clásico. 240 ml.',
    descriptionEn: 'Classic carajillo. 240 ml.',
    price: '149.00',
    drinkGroup: 'coffee_digestifs',
    fileName: 'classic.webp',
  },
  {
    nameEs: 'Carajillo Baileys',
    nameEn: 'Baileys Carajillo',
    descriptionEs: 'Carajillo con Baileys. 240 ml.',
    descriptionEn: 'Carajillo with Baileys. 240 ml.',
    price: '169.00',
    drinkGroup: 'coffee_digestifs',
    fileName: 'baileys.webp',
  },
]

// ─── CERVEZA DE BOTELLA (BEBIDAS_04) ──────────────────────────────────────────
// Text-only list — no individual photos except Caguamón en Bolsa

const BEERS: DrinkSeed[] = [
  // Nacional
  {
    nameEs: 'Indio',
    nameEn: 'Indio',
    descriptionEs: 'Cerveza de botella nacional. 325 ml.',
    descriptionEn: 'National bottled beer. 325 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  {
    nameEs: 'Tecate',
    nameEn: 'Tecate',
    descriptionEs: 'Cerveza de botella nacional. 325 ml.',
    descriptionEn: 'National bottled beer. 325 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  {
    nameEs: 'Tecate Light',
    nameEn: 'Tecate Light',
    descriptionEs: 'Cerveza de botella nacional. 325 ml.',
    descriptionEn: 'National bottled beer. 325 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  {
    nameEs: 'XX Ambar',
    nameEn: 'XX Ambar',
    descriptionEs: 'Cerveza de botella nacional. 325 ml.',
    descriptionEn: 'National bottled beer. 325 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  {
    nameEs: 'XX Lager',
    nameEn: 'XX Lager',
    descriptionEs: 'Cerveza de botella nacional. 325 ml.',
    descriptionEn: 'National bottled beer. 325 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  {
    nameEs: 'Sol',
    nameEn: 'Sol',
    descriptionEs: 'Cerveza de botella nacional. 355 ml.',
    descriptionEn: 'National bottled beer. 355 ml.',
    price: '59.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_nacional',
  },
  // Tamaños especiales
  {
    nameEs: 'Cerveza Clara y Oscura',
    nameEn: 'Light and Dark Beer',
    descriptionEs: '850 ml.',
    descriptionEn: '850 ml.',
    price: '99.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza',
  },
  {
    nameEs: 'Jarra de Cerveza',
    nameEn: 'Beer Pitcher',
    descriptionEs: '1.8 L.',
    descriptionEn: '1.8 L.',
    price: '179.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza',
  },
  // Premium
  {
    nameEs: 'Bohemia Clara',
    nameEn: 'Bohemia Clara',
    descriptionEs: 'Cerveza de botella premium. 355 ml.',
    descriptionEn: 'Premium bottled beer. 355 ml.',
    price: '79.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_premium',
  },
  {
    nameEs: 'Bohemia Oscura',
    nameEn: 'Bohemia Oscura',
    descriptionEs: 'Cerveza de botella premium. 355 ml.',
    descriptionEn: 'Premium bottled beer. 355 ml.',
    price: '79.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_premium',
  },
  {
    nameEs: 'Amstel Ultra',
    nameEn: 'Amstel Ultra',
    descriptionEs: 'Cerveza de botella premium. 355 ml.',
    descriptionEn: 'Premium bottled beer. 355 ml.',
    price: '79.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_premium',
  },
  {
    nameEs: 'Heineken',
    nameEn: 'Heineken',
    descriptionEs: 'Cerveza de botella premium. 355 ml.',
    descriptionEn: 'Premium bottled beer. 355 ml.',
    price: '79.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_premium',
  },
  {
    nameEs: 'Heineken Cero Lata',
    nameEn: 'Heineken Zero Can',
    descriptionEs: 'Cerveza sin alcohol en lata. 355 ml.',
    descriptionEn: 'Non-alcoholic beer can. 355 ml.',
    price: '79.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cerveza_premium',
    badgeEs: 'Sin alcohol',
    badgeEn: 'Non-alcoholic',
  },
  // Caguamón — has product photo in BEBIDAS_04
  {
    nameEs: 'Caguamón en Bolsa',
    nameEn: 'Beer Bag',
    descriptionEs: 'Cerveza Indio o XX Lager en bolsa.',
    descriptionEn: 'Indio or XX Lager beer served in a bag.',
    price: '149.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'caguamon',
    fileName: 'caguamon_en_bolsa.webp',
    badgeEs: 'Indio o XX Lager',
    badgeEn: 'Indio or XX Lager',
  },
  // Extras de bebidas (adicionales) — text only
  {
    nameEs: 'Tarro Chico Michelado',
    nameEn: 'Small Michelada Shot',
    descriptionEs: 'Adicional para tu bebida. 30 ml.',
    descriptionEn: 'Add-on for your drink. 30 ml.',
    price: '20.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
  {
    nameEs: 'Tarro Grande Michelado',
    nameEn: 'Large Michelada Shot',
    descriptionEs: 'Adicional para tu bebida. 60 ml.',
    descriptionEn: 'Add-on for your drink. 60 ml.',
    price: '39.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
  {
    nameEs: 'Tarro Chico Cubano',
    nameEn: 'Small Cuban Shot',
    descriptionEs: 'Adicional para tu bebida. 35 ml.',
    descriptionEn: 'Add-on for your drink. 35 ml.',
    price: '28.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
  {
    nameEs: 'Tarro Grande Cubano',
    nameEn: 'Large Cuban Shot',
    descriptionEs: 'Adicional para tu bebida. 70 ml.',
    descriptionEn: 'Add-on for your drink. 70 ml.',
    price: '48.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
  {
    nameEs: 'Tarro Chico con Clamato',
    nameEn: 'Small Clamato Shot',
    descriptionEs: 'Adicional para tu bebida. 120 ml.',
    descriptionEn: 'Add-on for your drink. 120 ml.',
    price: '32.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
  {
    nameEs: 'Tarro Grande con Clamato',
    nameEn: 'Large Clamato Shot',
    descriptionEs: 'Adicional para tu bebida. 240 ml.',
    descriptionEn: 'Add-on for your drink. 240 ml.',
    price: '54.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'extras_bebidas',
  },
]

// ─── 2x1 EN DESTILADO (BEBIDAS_04) ────────────────────────────────────────────
// Text-only list — no individual photos for any spirit
// price = copeo 2x1 (2 copas de 60 ml + mezclador 355 ml)
// badgeEs/badgeEn = bottle size + bottle price

const SPIRITS: DrinkSeed[] = [
  // Ron
  {
    nameEs: 'Bacardí Blanco',
    nameEn: 'Bacardí Blanco',
    descriptionEs: 'Ron. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Rum. 2 glasses of 60 ml + 355 ml mixer.',
    price: '119.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'ron',
    badgeEs: '700 ml · Botella $699',
    badgeEn: '700 ml · Bottle $699',
  },
  {
    nameEs: 'Matusalem Platino',
    nameEn: 'Matusalem Platino',
    descriptionEs: 'Ron. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Rum. 2 glasses of 60 ml + 355 ml mixer.',
    price: '139.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'ron',
    badgeEs: '750 ml · Botella $799',
    badgeEn: '750 ml · Bottle $799',
  },
  {
    nameEs: 'Matusalem Clásico',
    nameEn: 'Matusalem Clásico',
    descriptionEs: 'Ron. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Rum. 2 glasses of 60 ml + 355 ml mixer.',
    price: '139.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'ron',
    badgeEs: '750 ml · Botella $799',
    badgeEn: '750 ml · Bottle $799',
  },
  // Vodka
  {
    nameEs: 'Skyy',
    nameEn: 'Skyy Vodka',
    descriptionEs: 'Vodka. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Vodka. 2 glasses of 60 ml + 355 ml mixer.',
    price: '139.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'vodka',
    badgeEs: '750 ml · Botella $699',
    badgeEn: '750 ml · Bottle $699',
  },
  {
    nameEs: 'Smirnoff de Tamarindo',
    nameEn: 'Tamarind Smirnoff',
    descriptionEs: 'Vodka. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Vodka. 2 glasses of 60 ml + 355 ml mixer.',
    price: '139.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'vodka',
    badgeEs: '750 ml · Botella $699',
    badgeEn: '750 ml · Bottle $699',
  },
  // Brandy
  {
    nameEs: 'Torres 10',
    nameEn: 'Torres 10',
    descriptionEs: 'Brandy. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Brandy. 2 glasses of 60 ml + 355 ml mixer.',
    price: '169.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'brandy',
    badgeEs: '700 ml · Botella $1,199',
    badgeEn: '700 ml · Bottle $1,199',
  },
  {
    nameEs: 'Terry Centenario',
    nameEn: 'Terry Centenario',
    descriptionEs: 'Brandy. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Brandy. 2 glasses of 60 ml + 355 ml mixer.',
    price: '169.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'brandy',
    badgeEs: '700 ml · Botella $1,199',
    badgeEn: '700 ml · Bottle $1,199',
  },
  // Mezcal
  {
    nameEs: 'Amores Espadín Joven',
    nameEn: 'Amores Espadín Joven',
    descriptionEs: 'Mezcal. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Mezcal. 2 glasses of 60 ml + 355 ml mixer.',
    price: '249.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'mezcal',
    badgeEs: '700 ml · Botella $1,899',
    badgeEn: '700 ml · Bottle $1,899',
  },
  {
    nameEs: '400 Conejos',
    nameEn: '400 Conejos',
    descriptionEs: 'Mezcal. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Mezcal. 2 glasses of 60 ml + 355 ml mixer.',
    price: '249.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'mezcal',
    badgeEs: '700 ml · Botella $1,899',
    badgeEn: '700 ml · Bottle $1,899',
  },
  // Ginebra
  {
    nameEs: 'Tanqueray London Dry',
    nameEn: 'Tanqueray London Dry',
    descriptionEs: 'Ginebra. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Gin. 2 glasses of 60 ml + 355 ml mixer.',
    price: '249.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'ginebra',
    badgeEs: '750 ml · Botella $1,499',
    badgeEn: '750 ml · Bottle $1,499',
  },
  // Tequila
  {
    nameEs: 'Jose Cuervo Tradicional Plata',
    nameEn: 'Jose Cuervo Tradicional Plata',
    descriptionEs: 'Tequila. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Tequila. 2 glasses of 60 ml + 355 ml mixer.',
    price: '159.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'tequila',
    badgeEs: '695 ml · Botella $999',
    badgeEn: '695 ml · Bottle $999',
  },
  {
    nameEs: 'Jose Cuervo Tradicional Reposado',
    nameEn: 'Jose Cuervo Tradicional Reposado',
    descriptionEs: 'Tequila. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Tequila. 2 glasses of 60 ml + 355 ml mixer.',
    price: '159.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'tequila',
    badgeEs: '695 ml · Botella $999',
    badgeEn: '695 ml · Bottle $999',
  },
  {
    nameEs: 'Jose Cuervo Tradicional Especial',
    nameEn: 'Jose Cuervo Tradicional Especial',
    descriptionEs: 'Tequila. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Tequila. 2 glasses of 60 ml + 355 ml mixer.',
    price: '149.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'tequila',
    badgeEs: '950 ml · Botella $999',
    badgeEn: '950 ml · Bottle $999',
  },
  {
    nameEs: 'Jimador Reposado',
    nameEn: 'Jimador Reposado',
    descriptionEs: 'Tequila. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Tequila. 2 glasses of 60 ml + 355 ml mixer.',
    price: '159.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'tequila',
    badgeEs: '700 ml · Botella $999',
    badgeEn: '700 ml · Bottle $999',
  },
  // Whisky
  {
    nameEs: 'Jim Beam',
    nameEn: 'Jim Beam',
    descriptionEs: 'Whisky. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Whisky. 2 glasses of 60 ml + 355 ml mixer.',
    price: '229.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'whisky',
    badgeEs: '750 ml · Botella $999',
    badgeEn: '750 ml · Bottle $999',
  },
  {
    nameEs: 'J.W. Etiqueta Roja',
    nameEn: 'J.W. Red Label',
    descriptionEs: 'Whisky. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Whisky. 2 glasses of 60 ml + 355 ml mixer.',
    price: '229.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'whisky',
    badgeEs: '700 ml · Botella $899',
    badgeEn: '700 ml · Bottle $899',
  },
  {
    nameEs: "Jack Daniel's",
    nameEn: "Jack Daniel's",
    descriptionEs: 'Whisky. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Whisky. 2 glasses of 60 ml + 355 ml mixer.',
    price: '249.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'whisky',
    badgeEs: '700 ml · Botella $1,499',
    badgeEn: '700 ml · Bottle $1,499',
  },
  {
    nameEs: 'Black and White',
    nameEn: 'Black and White',
    descriptionEs: 'Whisky. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Whisky. 2 glasses of 60 ml + 355 ml mixer.',
    price: '169.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'whisky',
    badgeEs: '700 ml · Botella $899',
    badgeEn: '700 ml · Bottle $899',
  },
  // Cremas y licores
  {
    nameEs: 'Licor del 43',
    nameEn: 'Licor 43',
    descriptionEs: 'Crema y licor. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Cream liqueur. 2 glasses of 60 ml + 355 ml mixer.',
    price: '189.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cremas_licores',
    badgeEs: '750 ml · Botella $1,499',
    badgeEn: '750 ml · Bottle $1,499',
  },
  {
    nameEs: 'Baileys',
    nameEn: 'Baileys',
    descriptionEs: 'Crema y licor. 2 copas de 60 ml + mezclador 355 ml.',
    descriptionEn: 'Cream liqueur. 2 glasses of 60 ml + 355 ml mixer.',
    price: '169.00',
    drinkGroup: 'beers_spirits',
    drinkSubGroupKey: 'cremas_licores',
    badgeEs: '700 ml · Botella $999',
    badgeEn: '700 ml · Bottle $999',
  },
]

const ALL_DRINKS: DrinkSeed[] = [
  ...JUMBO_COCKTAILS,
  ...CANTARITOS,
  ...NON_ALCOHOLIC,
  ...SODAS,
  ...COFFEE_DIGESTIFS,
  ...BEERS,
  ...SPIRITS,
]

export async function seedDrinks() {
  console.log('  → Seeding drinks…')

  const [bebidasCategory] = await db
    .select({ id: menuCategories.id })
    .from(menuCategories)
    .where(eq(menuCategories.key, 'drinks'))
    .limit(1)

  if (!bebidasCategory) {
    throw new Error(
      'menuCategories row for key="drinks" not found — run category seed first'
    )
  }

  const groupRows = await db
    .select({ id: drinkGroups.id, groupKey: drinkGroups.groupKey })
    .from(drinkGroups)
  const groupIdByKey = Object.fromEntries(
    groupRows.map((r: { groupKey: string; id: string }) => [r.groupKey, r.id])
  )

  const subGroupRows = await db
    .select({ id: drinkSubGroups.id, key: drinkSubGroups.key })
    .from(drinkSubGroups)
  const subGroupIdByKey = Object.fromEntries(
    subGroupRows.map((r: { key: string; id: string }) => [r.key, r.id])
  )

  await db.delete(menuItems).where(eq(menuItems.categoryId, bebidasCategory.id))

  const rows = ALL_DRINKS.map((d, i) => ({
    categoryId: bebidasCategory.id,
    nameEs: d.nameEs,
    nameEn: d.nameEn,
    descriptionEs: d.descriptionEs,
    descriptionEn: d.descriptionEn,
    locationType: 'both' as const,
    price: d.price,
    includedInAyce: false,
    fileName: d.fileName ?? null,
    badgeEs: d.badgeEs ?? null,
    badgeEn: d.badgeEn ?? null,
    featured: d.featured ?? false,
    drinkGroupId: groupIdByKey[d.drinkGroup] ?? null,
    drinkSubGroupId: d.drinkSubGroupKey
      ? (subGroupIdByKey[d.drinkSubGroupKey] ?? null)
      : null,
    requiresSauce: false,
    isActive: true,
    displayOrder: i,
  }))

  await db.insert(menuItems).values(rows)

  console.log(`  ✓ ${rows.length} drinks inserted`)
}
