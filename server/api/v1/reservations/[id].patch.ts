import { and, eq, isNull } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { UpdateReservationSchema } from '../../../../types/reservations'
import { reservations } from '../../../db/schema'
import { db } from '../../../utils/db'
import { ConflictError, NotFoundError } from '../../../utils/error-handler'
import { ok } from '../../../utils/response'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') ?? ''
  const body = await readValidatedBody(event, v =>
    UpdateReservationSchema.parse(v)
  )

  const [existing] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), isNull(reservations.deletedAt)))

  if (!existing) throw new NotFoundError('Reservation')
  if (existing.status === 'cancelled')
    throw new ConflictError('Cannot modify a cancelled reservation')

  const [updated] = await db
    .update(reservations)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(reservations.id, id))
    .returning()

  return ok(updated)
})
