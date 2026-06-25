import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import type { FullMenuDish } from '@/types/menu'
import { handleError } from '../../../utils/error-handler'
import { getFullMenu } from '../../../utils/menu-queries'

const MenuQuerySchema = z.object({
  type: z.enum(['ayce', 'express']),
  modality: z.enum(['buffet', 'carta']).default('buffet'),
})

/**
 * Resolves the public image path from a raw DB fileName.
 * Returns null when fileName is null.
 */
function resolveImageUrl(
  fileName: string | null,
  locationType: 'ayce' | 'express' | 'both',
  categoryKey: string,
  includedInAyce: boolean
): string | null {
  if (!fileName) return null
  if (locationType === 'both') return `/menu/drinks/${fileName}`
  if (categoryKey === 'kids') return `/menu/kids/${fileName}`
  if (categoryKey === 'desserts') return `/menu/desserts/${fileName}`
  if (locationType === 'express') return `/menu/express/${fileName}`
  return includedInAyce
    ? `/menu/ayce/${fileName}`
    : `/menu/ala-carta/${fileName}`
}

function dishLocationType(
  dish: FullMenuDish,
  queryType: 'ayce' | 'express'
): 'ayce' | 'express' | 'both' {
  return dish.drinkGroup != null ? 'both' : queryType
}

export default defineEventHandler(async event => {
  try {
    const rawQuery = getQuery(event)
    const query = MenuQuerySchema.parse(rawQuery)

    const result = await getFullMenu({
      locationType: query.type,
      modality: query.modality,
    })

    const categories = result.categories.map(category => ({
      ...category,
      dishes: category.dishes.map(dish => {
        const locType = dishLocationType(dish, query.type)
        // buffet items with incluido=true are AYCE-included; carta = à-la-carte
        const includedInAyce = result.modality === 'buffet' && dish.incluido
        const imageUrl = resolveImageUrl(
          dish.imageUrl,
          locType,
          category.key,
          includedInAyce
        )
        return { ...dish, imageUrl }
      }),
    }))

    return { ...result, categories }
  } catch (err) {
    throw handleError(err)
  }
})
