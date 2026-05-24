import { eq } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { CreateReservationSchema } from '../../../types/reservations'
import { branches, reservations } from '../../db/schema'
import { db } from '../../utils/db'
import { UnprocessableError } from '../../utils/error-handler'
import { ok } from '../../utils/response'

export default defineEventHandler(async event => {
  const body = await readValidatedBody(event, v =>
    CreateReservationSchema.parse(v)
  )

  const [branch] = await db
    .select({ id: branches.id })
    .from(branches)
    .where(eq(branches.id, body.branchId))

  if (!branch) {
    throw new UnprocessableError('branchId does not exist')
  }

  const [row] = await db
    .insert(reservations)
    .values({
      branchId: body.branchId,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      partySize: body.partySize,
      reservationDate: body.reservationDate,
      reservationTime: body.reservationTime,
      notes: body.notes ?? null,
    })
    .returning()

  setResponseStatus(event, 201)
  return ok(row)
})
