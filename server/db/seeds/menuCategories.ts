import { db } from '../../utils/db'
import { menuCategories } from '../schema'

type CategoryKey =
  | 'appetizers'
  | 'salads'
  | 'rice'
  | 'ramen'
  | 'burgers'
  | 'sandwiches'
  | 'burritos'
  | 'hot_dogs'
  | 'cold_rolls'
  | 'hot_rolls'
  | 'sweet_rolls'
  | 'desserts'
  | 'wings'
  | 'sauces'
  | 'extras'
  | 'drinks'
  | 'kids'

const CATEGORIES: {
  key: CategoryKey
  nameEs: string
  nameEn: string
  displayOrder: number
  isActive: boolean
}[] = [
  {
    key: 'appetizers',
    nameEs: 'Entradas',
    nameEn: 'Appetizers',
    displayOrder: 0,
    isActive: true,
  },
  {
    key: 'salads',
    nameEs: 'Ensaladas',
    nameEn: 'Salads',
    displayOrder: 1,
    isActive: true,
  },
  {
    key: 'rice',
    nameEs: 'Arroces',
    nameEn: 'Rice Dishes',
    displayOrder: 2,
    isActive: true,
  },
  {
    key: 'ramen',
    nameEs: 'Ramen',
    nameEn: 'Ramen',
    displayOrder: 3,
    isActive: true,
  },
  {
    key: 'burgers',
    nameEs: 'Smash Burgers',
    nameEn: 'Smash Burgers',
    displayOrder: 4,
    isActive: true,
  },
  {
    key: 'sandwiches',
    nameEs: 'Sándwich',
    nameEn: 'Sandwiches',
    displayOrder: 5,
    isActive: true,
  },
  {
    key: 'burritos',
    nameEs: 'Burritos',
    nameEn: 'Burritos',
    displayOrder: 6,
    isActive: true,
  },
  {
    key: 'hot_dogs',
    nameEs: 'Hot Dogs',
    nameEn: 'Hot Dogs',
    displayOrder: 7,
    isActive: true,
  },
  {
    key: 'cold_rolls',
    nameEs: 'Rollos Sushi Frío',
    nameEn: 'Cold Sushi Rolls',
    displayOrder: 8,
    isActive: true,
  },
  {
    key: 'hot_rolls',
    nameEs: 'Sushi Caliente',
    nameEn: 'Hot Sushi Rolls',
    displayOrder: 9,
    isActive: true,
  },
  {
    key: 'sweet_rolls',
    nameEs: 'Rollo Sushi Dulce',
    nameEn: 'Sweet Rolls',
    displayOrder: 10,
    isActive: true,
  },
  {
    key: 'desserts',
    nameEs: 'Postres',
    nameEn: 'Desserts',
    displayOrder: 11,
    isActive: true,
  },
  {
    key: 'wings',
    nameEs: 'Alitas y Boneless',
    nameEn: 'Wings and Boneless',
    displayOrder: 12,
    isActive: true,
  },
  {
    key: 'sauces',
    nameEs: 'Salsas',
    nameEn: 'Sauces',
    displayOrder: 13,
    isActive: true,
  },
  {
    key: 'extras',
    nameEs: 'Extras',
    nameEn: 'Extras',
    displayOrder: 14,
    isActive: true,
  },
  {
    key: 'drinks',
    nameEs: 'Bebidas',
    nameEn: 'Drinks',
    displayOrder: 15,
    isActive: true,
  },
  {
    key: 'kids',
    nameEs: 'Menú Kids',
    nameEn: 'Kids Menu',
    displayOrder: 16,
    isActive: true,
  },
]

export async function seedMenuCategories() {
  console.log('  → Seeding menu categories…')

  for (const cat of CATEGORIES) {
    await db
      .insert(menuCategories)
      .values({
        key: cat.key,
        nameEs: cat.nameEs,
        nameEn: cat.nameEn,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      })
      .onConflictDoUpdate({
        target: menuCategories.key,
        set: {
          nameEs: cat.nameEs,
          nameEn: cat.nameEn,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
        },
      })
  }

  console.log(`  ✓ ${CATEGORIES.length} menu categories upserted`)
}
