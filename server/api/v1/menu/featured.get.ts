import { defineEventHandler } from 'h3'
import {
  DatabaseUnavailableError,
  handleError,
} from '../../../utils/error-handler'
import { getFeaturedDishes } from '../../../utils/menu-queries'

export default defineEventHandler(async () => {
  try {
    return await getFeaturedDishes()
  } catch (err) {
    // Transient Neon unavailability (survived retries): WARN via the handler and
    // DEGRADE to an empty rail so the homepage still renders — never a raw 500.
    if (err instanceof DatabaseUnavailableError) {
      handleError(err)
      return []
    }
    throw handleError(err)
  }
})
