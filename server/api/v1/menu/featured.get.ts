import { defineEventHandler } from 'h3'
import { handleError } from '../../../utils/error-handler'
import { getFeaturedDishes } from '../../../utils/menu-queries'

export default defineEventHandler(async () => {
  try {
    return await getFeaturedDishes()
  } catch (err) {
    throw handleError(err)
  }
})
