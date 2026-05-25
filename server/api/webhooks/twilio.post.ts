import { and, eq, inArray } from 'drizzle-orm'
import {
  createError,
  defineEventHandler,
  getHeader,
  readRawBody,
  setResponseHeader,
} from 'h3'
import { branches, reservations } from '../../db/schema'
import { db } from '../../utils/db'
import { env } from '../../utils/env'
import { logger } from '../../utils/logger'
import {
  normalizePhone,
  sendWhatsAppMessage,
  verifyTwilioSignature,
} from '../../utils/twilio'
import {
  msgClienteConfirmado,
  msgClienteRechazado,
  msgEncargadoKeywordInvalido,
} from '../../utils/whatsapp-messages'

const KEYWORD_REGEX = /^(ACEPTAR|RECHAZAR)\s+([A-Z0-9]{8})$/
const TWIML_EMPTY = '<?xml version="1.0" encoding="UTF-8"?><Response/>'

export default defineEventHandler(async event => {
  const signature = getHeader(event, 'x-twilio-signature') ?? ''
  const rawBody = (await readRawBody(event)) ?? ''

  const params = Object.fromEntries(new URLSearchParams(rawBody))

  const proto = getHeader(event, 'x-forwarded-proto') ?? 'https'
  const host = getHeader(event, 'host') ?? ''
  const url = `${proto}://${host}/api/webhooks/twilio`

  const valid = verifyTwilioSignature(
    env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  )
  if (!valid) throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  const from = normalizePhone((params.From ?? '').replace('whatsapp:', ''))
  const body = (params.Body ?? '').trim().toUpperCase()

  const match = KEYWORD_REGEX.exec(body)
  if (!match) {
    const folio = body.split(/\s+/)[1] ?? '????????'
    await sendWhatsAppMessage(from, msgEncargadoKeywordInvalido(folio)).catch(
      err => logger.error({ err }, 'Failed to send keyword help')
    )
    setResponseHeader(event, 'content-type', 'text/xml')
    return TWIML_EMPTY
  }

  const [, keyword, folio] = match as RegExpExecArray & [string, string, string]

  const [reservation] = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.folio, folio),
        inArray(reservations.status, ['pending', 'escalated'])
      )
    )

  if (!reservation) {
    setResponseHeader(event, 'content-type', 'text/xml')
    return TWIML_EMPTY
  }

  const newStatus = keyword === 'ACEPTAR' ? 'confirmed' : 'rejected'

  await db
    .update(reservations)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(reservations.id, reservation.id))

  const [branchDetails] = await db
    .select({ name: branches.name })
    .from(branches)
    .where(eq(branches.id, reservation.branchId))

  const messageData = {
    folio: reservation.folio,
    contactName: reservation.contactName,
    contactPhone: reservation.contactPhone,
    branchName: branchDetails?.name ?? '',
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
    partySize: reservation.partySize,
  }

  const clientMsg =
    newStatus === 'confirmed'
      ? msgClienteConfirmado(messageData)
      : msgClienteRechazado(messageData)

  await sendWhatsAppMessage(reservation.contactPhone, clientMsg).catch(err =>
    logger.error({ err, folio }, 'Failed to notify client')
  )

  setResponseHeader(event, 'content-type', 'text/xml')
  return TWIML_EMPTY
})
