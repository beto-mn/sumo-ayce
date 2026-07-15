import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import {
  DatabaseUnavailableError,
  handleError,
} from '../../../utils/error-handler'
import { emptyMenuResult, getFullMenu } from '../../../utils/menu-queries'

const MenuQuerySchema = z.object({
  type: z.enum(['ayce', 'express', 'kids']),
  modality: z.enum(['buffet', 'carta']).default('buffet'),
})

export default defineEventHandler(async event => {
  const query = (() => {
    try {
      return MenuQuerySchema.parse(getQuery(event))
    } catch (err) {
      throw handleError(err)
    }
  })()

  try {
    return await getFullMenu({
      locationType: query.type,
      modality: query.modality,
    })
  } catch (err) {
    // Transient Neon unavailability (survived retries): log at WARN via the
    // handler and DEGRADE to an empty menu the page renders as a friendly
    // "temporarily unavailable" state — never a raw 500.
    if (err instanceof DatabaseUnavailableError) {
      handleError(err)
      return emptyMenuResult(query.type, query.modality)
    }
    throw handleError(err)
  }
})
