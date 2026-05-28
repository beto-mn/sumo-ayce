import { asc, eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { rewards } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { handleError } from '../../../../utils/error-handler'
import { ok } from '../../../../utils/response'

export default defineEventHandler(async () => {
  try {
    const results = await db
      .select({
        id: rewards.id,
        name: rewards.name,
        description: rewards.description,
        pointsCost: rewards.pointsCost,
      })
      .from(rewards)
      .where(eq(rewards.isActive, true))
      .orderBy(asc(rewards.pointsCost))

    return ok(results)
  } catch (err) {
    throw handleError(err)
  }
})
