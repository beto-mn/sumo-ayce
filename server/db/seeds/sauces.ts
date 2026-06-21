import { db } from '../../utils/db'
import { sauces } from '../schema'

// Ordered from least to most spicy (spiceLevel 0 = Parmesano, 12 = Jaguar)
const SAUCES: {
  nameEs: string
  nameEn: string
  spiceLevel: number
  fileName: string
}[] = [
  {
    nameEs: 'Parmesano',
    nameEn: 'Parmesan',
    spiceLevel: 0,
    fileName: 'parmesan.webp',
  },
  { nameEs: 'Lemon', nameEn: 'Lemon', spiceLevel: 1, fileName: 'lemon.webp' },
  { nameEs: 'BBQ', nameEn: 'BBQ', spiceLevel: 2, fileName: 'bbq.webp' },
  {
    nameEs: 'Apple BBQ',
    nameEn: 'Apple BBQ',
    spiceLevel: 3,
    fileName: 'apple_bbq.webp',
  },
  {
    nameEs: 'Coronel Original',
    nameEn: 'Coronel Original',
    spiceLevel: 4,
    fileName: 'coronel_original.webp',
  },
  {
    nameEs: 'Tabasco Heat',
    nameEn: 'Tabasco Heat',
    spiceLevel: 5,
    fileName: 'tabasco_heat.webp',
  },
  {
    nameEs: 'Coronel Hot',
    nameEn: 'Coronel Hot',
    spiceLevel: 6,
    fileName: 'coronel_hot.webp',
  },
  {
    nameEs: 'Original',
    nameEn: 'Original',
    spiceLevel: 7,
    fileName: 'original.webp',
  },
  {
    nameEs: 'Maracuyá',
    nameEn: 'Maracuya',
    spiceLevel: 8,
    fileName: 'maracuya.webp',
  },
  {
    nameEs: 'Buffalo Ranch',
    nameEn: 'Buffalo Ranch',
    spiceLevel: 9,
    fileName: 'buffalo_ranch.webp',
  },
  { nameEs: 'Cajun', nameEn: 'Cajun', spiceLevel: 10, fileName: 'cajun.webp' },
  {
    nameEs: 'Mango Habanero',
    nameEn: 'Mango Habanero',
    spiceLevel: 11,
    fileName: 'mango_habanero.webp',
  },
  {
    nameEs: 'Jaguar',
    nameEn: 'Jaguar',
    spiceLevel: 12,
    fileName: 'jaguar.webp',
  },
]

export async function seedSauces() {
  console.log('  → Seeding sauces…')

  await db.delete(sauces)

  await db.insert(sauces).values(
    SAUCES.map(sauce => ({
      nameEs: sauce.nameEs,
      nameEn: sauce.nameEn,
      spiceLevel: sauce.spiceLevel,
      fileName: sauce.fileName,
      isActive: true,
    }))
  )

  console.log(`  ✓ ${SAUCES.length} sauces inserted`)
}
