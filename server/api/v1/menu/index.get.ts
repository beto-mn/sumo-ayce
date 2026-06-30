import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { handleError } from '../../../utils/error-handler'
import { getFullMenu } from '../../../utils/menu-queries'

const MenuQuerySchema = z.object({
  type: z.enum(['ayce', 'express']),
  modality: z.enum(['buffet', 'carta']).default('buffet'),
})

export default defineEventHandler(async event => {
  try {
    const rawQuery = getQuery(event)
    const query = MenuQuerySchema.parse(rawQuery)

    const result = await getFullMenu({
      locationType: query.type,
      modality: query.modality,
    })

    return result
  } catch (err) {
    throw handleError(err)
  }
})
