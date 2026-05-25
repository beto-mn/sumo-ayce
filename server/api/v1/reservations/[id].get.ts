import { and, eq, isNull } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { reservations } from '../../../db/schema'
import { db } from '../../../utils/db'
import { NotFoundError } from '../../../utils/error-handler'
import { ok } from '../../../utils/response'

export default defineEventHandler(async event => {
  const id = getRouterParam(event, 'id') ?? ''

  const [row] = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.id, id), isNull(reservations.deletedAt)))

  if (!row) throw new NotFoundError('Reservation')

  return ok(row)
})
