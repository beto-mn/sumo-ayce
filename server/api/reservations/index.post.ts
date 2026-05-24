import { eq } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { CreateReservationSchema } from '../../../types/reservations'
import { branches, reservations } from '../../db/schema'
import { db } from '../../utils/db'
import { UnprocessableError } from '../../utils/error-handler'
import { generateFolio } from '../../utils/folio'
import { logger } from '../../utils/logger'
import { ok } from '../../utils/response'
import { sendWhatsAppMessage } from '../../utils/twilio'
import {
  msgClientePendiente,
  msgEncargadoSolicitud,
} from '../../utils/whatsapp-messages'

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

  const id = crypto.randomUUID()
  const folio = generateFolio(id)

  const [row] = await db
    .insert(reservations)
    .values({
      id,
      folio,
      branchId: body.branchId,
      contactName: body.contactName,
      contactPhone: body.contactPhone,
      partySize: body.partySize,
      reservationDate: body.reservationDate,
      reservationTime: body.reservationTime,
      notes: body.notes ?? null,
    })
    .returning()

  const [branchDetails] = await db
    .select({
      name: branches.name,
      whatsappReservaciones: branches.whatsappReservaciones,
    })
    .from(branches)
    .where(eq(branches.id, body.branchId))

  const messageData = {
    folio,
    contactName: body.contactName,
    contactPhone: body.contactPhone,
    branchName: branchDetails.name,
    reservationDate: body.reservationDate,
    reservationTime: body.reservationTime,
    partySize: body.partySize,
  }

  const sends: Promise<void>[] = [
    sendWhatsAppMessage(body.contactPhone, msgClientePendiente(messageData)),
  ]

  if (branchDetails.whatsappReservaciones) {
    sends.push(
      sendWhatsAppMessage(
        branchDetails.whatsappReservaciones,
        msgEncargadoSolicitud(messageData)
      )
    )
  }

  const results = await Promise.allSettled(sends)
  for (const result of results) {
    if (result.status === 'rejected') {
      logger.error(
        { error: result.reason, folio },
        'WhatsApp notification failed'
      )
    }
  }

  setResponseStatus(event, 201)
  return ok(row)
})
