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

export const CATEGORIES: {
  key: CategoryKey
  nameEs: string
  nameEn: string
  displayOrder: number
  isActive: boolean
  noteEs?: string | null
  noteEn?: string | null
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
    nameEs: 'Arroz',
    nameEn: 'Rice',
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
    nameEs: 'Hamburguesas',
    nameEn: 'Burgers',
    displayOrder: 4,
    isActive: true,
  },
  {
    key: 'sandwiches',
    nameEs: 'Sándwiches',
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
    nameEs: 'Sushi Frío',
    nameEn: 'Cold Rolls',
    displayOrder: 8,
    isActive: true,
  },
  {
    key: 'hot_rolls',
    nameEs: 'Sushi Caliente',
    nameEn: 'Hot Rolls',
    displayOrder: 9,
    isActive: true,
  },
  {
    key: 'sweet_rolls',
    nameEs: 'Sushi Dulce',
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
    nameEs: 'Alitas & Boneless',
    nameEn: 'Wings & Boneless',
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
    nameEs: 'Bebidas y coctelería',
    nameEn: 'Drinks & cocktails',
    displayOrder: 15,
    isActive: true,
  },
  {
    key: 'kids',
    nameEs: 'Menú Kids',
    nameEn: 'Kids Menu',
    displayOrder: 16,
    isActive: true,
    noteEs:
      'Incluye papas a la francesa (100 g), refresco (400 ml), sushi kids (5 pzas de cualquier rollo de nuestra carta) y un yakimeshi (240 g).',
    noteEn:
      'Includes french fries (100 g), a soft drink (400 ml), sushi kids (5 pcs of any roll from our menu) and a yakimeshi (240 g).',
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
        noteEs: cat.noteEs ?? null,
        noteEn: cat.noteEn ?? null,
        displayOrder: cat.displayOrder,
        isActive: cat.isActive,
      })
      .onConflictDoUpdate({
        target: menuCategories.key,
        set: {
          nameEs: cat.nameEs,
          nameEn: cat.nameEn,
          noteEs: cat.noteEs ?? null,
          noteEn: cat.noteEn ?? null,
          displayOrder: cat.displayOrder,
          isActive: cat.isActive,
        },
      })
  }

  console.log(`  ✓ ${CATEGORIES.length} menu categories upserted`)
}
