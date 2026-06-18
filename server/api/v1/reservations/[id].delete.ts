import { eq } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { reservations } from '../../../db/schema'
import { db } from '../../../utils/db'
import { ConflictError, NotFoundError } from '../../../utils/error-handler'
import { ok } from '../../../utils/response'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') ?? ''

  const [existing] = await db
    .select()
    .from(reservations)
    .where(eq(reservations.id, id))

  if (!existing) throw new NotFoundError('Reservation')
  if (existing.status === 'cancelled')
    throw new ConflictError('Reservation is already cancelled')

  const now = new Date()
  const [updated] = await db
    .update(reservations)
    .set({ status: 'cancelled', deletedAt: now, updatedAt: now })
    .where(eq(reservations.id, id))
    .returning()

  return ok(updated)
})
