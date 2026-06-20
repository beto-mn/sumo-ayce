// Local/dev seed for the menu data layer. Run via `pnpm db:seed`, which loads
// `.env.local` (`tsx --env-file-if-exists`) so the validated env (DATABASE_URL
// etc.) is present before the DB client is imported.
import { and, eq } from 'drizzle-orm'
import { db } from '../utils/db'
import { logger } from '../utils/logger'
import { menuCategories, menuItems, sauces } from './schema'

type CategoryKey =
  | 'entradas'
  | 'burgers'
  | 'sandwich'
  | 'burritos'
  | 'hotdogs'
  | 'frio'
  | 'caliente'
  | 'dulce'
  | 'postres'
  | 'alitas'
  | 'salsas'
  | 'extras'
  | 'bebidas'

// ─── Static seed data ───────────────────────────────────────────────────────────

const CATEGORIES: {
  key: CategoryKey
  nameEs: string
  nameEn: string
  displayOrder: number
}[] = [
  { key: 'entradas', nameEs: 'Entradas', nameEn: 'Starters', displayOrder: 0 },
  { key: 'burgers', nameEs: 'Burgers', nameEn: 'Burgers', displayOrder: 1 },
  { key: 'sandwich', nameEs: 'Sándwich', nameEn: 'Sandwich', displayOrder: 2 },
  { key: 'burritos', nameEs: 'Burritos', nameEn: 'Burritos', displayOrder: 3 },
  { key: 'hotdogs', nameEs: 'Hot Dogs', nameEn: 'Hot Dogs', displayOrder: 4 },
  { key: 'frio', nameEs: 'Frío', nameEn: 'Cold', displayOrder: 5 },
  { key: 'caliente', nameEs: 'Caliente', nameEn: 'Hot', displayOrder: 6 },
  { key: 'dulce', nameEs: 'Dulce', nameEn: 'Sweet', displayOrder: 7 },
  { key: 'postres', nameEs: 'Postres', nameEn: 'Desserts', displayOrder: 8 },
  {
    key: 'alitas',
    nameEs: 'Wings & Boneless',
    nameEn: 'Wings & Boneless',
    displayOrder: 9,
  },
  { key: 'salsas', nameEs: 'Salsas', nameEn: 'Sauces', displayOrder: 10 },
  { key: 'extras', nameEs: 'Extras', nameEn: 'Extras', displayOrder: 11 },
  { key: 'bebidas', nameEs: 'Bebidas', nameEn: 'Drinks', displayOrder: 12 },
]

// The 12 Wings & Boneless sauces (representative copy; client may refine later).
const SAUCES: { nameEs: string; nameEn: string; displayOrder: number }[] = [
  { nameEs: 'BBQ', nameEn: 'BBQ', displayOrder: 0 },
  { nameEs: 'Buffalo', nameEn: 'Buffalo', displayOrder: 1 },
  { nameEs: 'Mango Habanero', nameEn: 'Mango Habanero', displayOrder: 2 },
  { nameEs: 'Teriyaki', nameEn: 'Teriyaki', displayOrder: 3 },
  { nameEs: 'Ajo Parmesano', nameEn: 'Garlic Parmesan', displayOrder: 4 },
  { nameEs: 'Búfalo Picante', nameEn: 'Spicy Buffalo', displayOrder: 5 },
  { nameEs: 'Chipotle', nameEn: 'Chipotle', displayOrder: 6 },
  { nameEs: 'Honey Mustard', nameEn: 'Honey Mustard', displayOrder: 7 },
  { nameEs: 'Tamarindo', nameEn: 'Tamarind', displayOrder: 8 },
  { nameEs: 'Lemon Pepper', nameEn: 'Lemon Pepper', displayOrder: 9 },
  { nameEs: 'Sriracha', nameEn: 'Sriracha', displayOrder: 10 },
  { nameEs: 'Maracuyá', nameEn: 'Passion Fruit', displayOrder: 11 },
]

type SeedDish = Omit<typeof menuItems.$inferInsert, 'categoryId'> & {
  category: CategoryKey
}

// Representative dishes/drinks. À-la-carte prices are PLACEHOLDERS pending the
// client's printed-menu PDF (the price column is nullable; null = not yet known).
const DISHES: SeedDish[] = [
  {
    category: 'entradas',
    nameEs: 'Edamames',
    nameEn: 'Edamame',
    descriptionEs: 'Vainas de soya al vapor con sal de mar.',
    descriptionEn: 'Steamed soybean pods with sea salt.',
    locationType: 'both',
    price: '65.00', // placeholder
    includedInAyce: true,
    featured: true,
    badge: 'Favorito',
    displayOrder: 0,
  },
  {
    category: 'alitas',
    nameEs: 'Boneless',
    nameEn: 'Boneless',
    descriptionEs: 'Boneless crujientes con tu salsa favorita.',
    descriptionEn: 'Crispy boneless with your favorite sauce.',
    locationType: 'ayce',
    price: '129.00', // placeholder
    includedInAyce: true,
    requiresSauce: true,
    featured: true,
    badge: 'Estrella',
    displayOrder: 0,
  },
  {
    category: 'alitas',
    nameEs: 'Alitas',
    nameEn: 'Wings',
    descriptionEs: 'Alitas glaseadas, incluye 1 salsa a elegir.',
    descriptionEn: 'Glazed wings, includes 1 sauce of your choice.',
    locationType: 'ayce',
    price: null, // price pending client PDF
    includedInAyce: true,
    requiresSauce: true,
    displayOrder: 1,
  },
  {
    category: 'sandwich',
    nameEs: 'Sumo Sándwich',
    nameEn: 'Sumo Sandwich',
    descriptionEs: 'Sándwich estilo americano-japonés de la casa.',
    descriptionEn: 'House American-Japanese style sandwich.',
    locationType: 'ayce',
    price: '99.00', // placeholder
    includedInAyce: true,
    displayOrder: 0,
  },
  {
    category: 'burritos',
    nameEs: 'Burrito Sumo',
    nameEn: 'Sumo Burrito',
    descriptionEs: 'Burrito relleno estilo americano-japonés.',
    descriptionEn: 'Filled American-Japanese style burrito.',
    locationType: 'express',
    price: '89.00', // placeholder
    includedInAyce: false,
    displayOrder: 0,
  },
  {
    category: 'postres',
    nameEs: 'Cheesecake',
    nameEn: 'Cheesecake',
    descriptionEs: 'Cheesecake cremoso con coulis de frutos rojos.',
    descriptionEn: 'Creamy cheesecake with red berry coulis.',
    locationType: 'express',
    price: '75.00', // placeholder
    includedInAyce: false,
    displayOrder: 0,
  },
  {
    category: 'bebidas',
    nameEs: 'Mojito Jumbo',
    nameEn: 'Jumbo Mojito',
    descriptionEs: 'Coctel jumbo de menta y limón.',
    descriptionEn: 'Jumbo mint and lime cocktail.',
    locationType: 'both',
    price: '120.00', // placeholder
    includedInAyce: false,
    featured: true,
    badge: 'Nuevo',
    drinkGroup: 'jumbo_cocktails',
    displayOrder: 0,
  },
  {
    category: 'bebidas',
    nameEs: 'Refresco',
    nameEn: 'Soda',
    descriptionEs: 'Refresco de la casa, recarga incluida.',
    descriptionEn: 'House soda, refill included.',
    locationType: 'both',
    price: null,
    includedInAyce: true,
    drinkGroup: 'sodas',
    displayOrder: 1,
  },
  {
    category: 'bebidas',
    nameEs: 'Café Americano',
    nameEn: 'Americano Coffee',
    descriptionEs: 'Café americano recién preparado.',
    descriptionEn: 'Freshly brewed americano coffee.',
    locationType: 'both',
    price: null,
    includedInAyce: true,
    drinkGroup: 'coffee_digestifs',
    displayOrder: 2,
  },
]

// ─── Seed routines (each ≤ 30 lines) ────────────────────────────────────────────

async function seedCategories(): Promise<Map<CategoryKey, string>> {
  await db.insert(menuCategories).values(CATEGORIES).onConflictDoNothing({
    target: menuCategories.key,
  })
  const rows: { id: string; key: CategoryKey }[] = await db
    .select({ id: menuCategories.id, key: menuCategories.key })
    .from(menuCategories)
  logger.info({ count: rows.length }, 'seed: menu categories present')
  return new Map(rows.map(row => [row.key, row.id]))
}

async function seedSauces(): Promise<void> {
  for (const sauce of SAUCES) {
    const existing = await db
      .select({ id: sauces.id })
      .from(sauces)
      .where(eq(sauces.nameEs, sauce.nameEs))
    if (existing.length > 0) continue
    await db.insert(sauces).values(sauce)
  }
  const rows = await db.select({ id: sauces.id }).from(sauces)
  logger.info({ count: rows.length }, 'seed: sauces present')
}

async function seedDishes(
  categoryIds: Map<CategoryKey, string>
): Promise<void> {
  for (const { category, ...dish } of DISHES) {
    const categoryId = categoryIds.get(category)
    if (!categoryId) throw new Error(`Missing category for key: ${category}`)
    const existing = await db
      .select({ id: menuItems.id })
      .from(menuItems)
      .where(
        and(
          eq(menuItems.categoryId, categoryId),
          eq(menuItems.nameEs, dish.nameEs)
        )
      )
    if (existing.length > 0) continue
    await db.insert(menuItems).values({ ...dish, categoryId })
  }
  const rows = await db.select({ id: menuItems.id }).from(menuItems)
  logger.info({ count: rows.length }, 'seed: dishes present')
}

async function main(): Promise<void> {
  logger.info('seed: starting menu seed')
  const categoryIds = await seedCategories()
  await seedSauces()
  await seedDishes(categoryIds)
  logger.info('seed: menu seed complete')
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    logger.error({ error }, 'seed: failed')
    process.exit(1)
  })
