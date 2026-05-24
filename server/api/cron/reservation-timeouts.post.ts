import { and, eq, isNotNull, isNull, lt } from 'drizzle-orm'
import { createError, defineEventHandler, getHeader } from 'h3'
import { branches, reservations } from '../../db/schema'
import { db } from '../../utils/db'
import { env } from '../../utils/env'
import { logger } from '../../utils/logger'
import { reservationTimeouts } from '../../utils/reservation-config'
import { sendWhatsAppMessage } from '../../utils/twilio'
import {
  msgClienteCanceladoAuto,
  msgEncargadoCanceladoAuto,
  msgEncargadoRecordatorio,
  msgSecundarioEscalacion,
} from '../../utils/whatsapp-messages'

export default defineEventHandler(async event => {
  const auth = getHeader(event, 'authorization') ?? ''
  if (!env.CRON_SECRET || auth !== `Bearer ${env.CRON_SECRET}`) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const now = new Date()
  const firstReminderCutoff = new Date(
    now.getTime() - reservationTimeouts.firstReminderMin * 60 * 1000
  )
  const escalationCutoff = new Date(
    now.getTime() - reservationTimeouts.escalationMin * 60 * 1000
  )
  const autoCancelCutoff = new Date(
    now.getTime() - reservationTimeouts.autoCancelMin * 60 * 1000
  )

  let firstReminderCount = 0
  let escalatedCount = 0
  let cancelledAutoCount = 0

  // Query 1: pending, no firstReminderAt, createdAt old enough → send reminder, set firstReminderAt
  const firstReminderCandidates = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.status, 'pending'),
        isNull(reservations.firstReminderAt),
        lt(reservations.createdAt, firstReminderCutoff),
        isNull(reservations.deletedAt)
      )
    )

  for (const res of firstReminderCandidates) {
    const [branch] = await db
      .select({
        whatsappReservaciones: branches.whatsappReservaciones,
        whatsappReservacionesBackup: branches.whatsappReservacionesBackup,
        name: branches.name,
      })
      .from(branches)
      .where(eq(branches.id, res.branchId))

    if (!branch?.whatsappReservaciones) continue

    const msgData = {
      folio: res.folio,
      contactName: res.contactName,
      contactPhone: res.contactPhone,
      branchName: branch.name,
      reservationDate: res.reservationDate,
      reservationTime: res.reservationTime,
      partySize: res.partySize,
    }

    await sendWhatsAppMessage(
      branch.whatsappReservaciones,
      msgEncargadoRecordatorio(msgData)
    ).catch(err =>
      logger.error({ err, folio: res.folio }, 'Failed to send first reminder')
    )

    await db
      .update(reservations)
      .set({ firstReminderAt: now, updatedAt: now })
      .where(eq(reservations.id, res.id))

    firstReminderCount++
  }

  // Query 2: pending, firstReminderAt elapsed → escalate: notify primary + secondary, update status
  const escalationCandidates = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.status, 'pending'),
        isNotNull(reservations.firstReminderAt),
        lt(reservations.firstReminderAt, escalationCutoff),
        isNull(reservations.deletedAt)
      )
    )

  for (const res of escalationCandidates) {
    const [branch] = await db
      .select({
        whatsappReservaciones: branches.whatsappReservaciones,
        whatsappReservacionesBackup: branches.whatsappReservacionesBackup,
        name: branches.name,
      })
      .from(branches)
      .where(eq(branches.id, res.branchId))

    if (!branch?.whatsappReservaciones) continue

    const msgData = {
      folio: res.folio,
      contactName: res.contactName,
      contactPhone: res.contactPhone,
      branchName: branch.name,
      reservationDate: res.reservationDate,
      reservationTime: res.reservationTime,
      partySize: res.partySize,
    }

    const sends = [
      sendWhatsAppMessage(
        branch.whatsappReservaciones,
        msgEncargadoRecordatorio(msgData)
      ),
    ]
    if (branch.whatsappReservacionesBackup) {
      sends.push(
        sendWhatsAppMessage(
          branch.whatsappReservacionesBackup,
          msgSecundarioEscalacion(msgData)
        )
      )
    }

    const results = await Promise.allSettled(sends)
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error(
          { err: r.reason, folio: res.folio },
          'Failed to send escalation message'
        )
      }
    }

    await db
      .update(reservations)
      .set({ status: 'escalated', escalatedAt: now, updatedAt: now })
      .where(eq(reservations.id, res.id))

    escalatedCount++
  }

  // Query 3: escalated, escalatedAt elapsed → auto-cancel: notify client + primary + secondary
  const autoCancelCandidates = await db
    .select()
    .from(reservations)
    .where(
      and(
        eq(reservations.status, 'escalated'),
        isNotNull(reservations.escalatedAt),
        lt(reservations.escalatedAt, autoCancelCutoff),
        isNull(reservations.deletedAt)
      )
    )

  for (const res of autoCancelCandidates) {
    const [branch] = await db
      .select({
        whatsappReservaciones: branches.whatsappReservaciones,
        whatsappReservacionesBackup: branches.whatsappReservacionesBackup,
        name: branches.name,
      })
      .from(branches)
      .where(eq(branches.id, res.branchId))

    if (!branch?.whatsappReservaciones) continue

    const msgData = {
      folio: res.folio,
      contactName: res.contactName,
      contactPhone: res.contactPhone,
      branchName: branch.name,
      reservationDate: res.reservationDate,
      reservationTime: res.reservationTime,
      partySize: res.partySize,
    }

    const sends = [
      sendWhatsAppMessage(res.contactPhone, msgClienteCanceladoAuto(msgData)),
      sendWhatsAppMessage(
        branch.whatsappReservaciones,
        msgEncargadoCanceladoAuto(msgData)
      ),
    ]
    if (branch.whatsappReservacionesBackup) {
      sends.push(
        sendWhatsAppMessage(
          branch.whatsappReservacionesBackup,
          msgEncargadoCanceladoAuto(msgData)
        )
      )
    }

    const results = await Promise.allSettled(sends)
    for (const r of results) {
      if (r.status === 'rejected') {
        logger.error(
          { err: r.reason, folio: res.folio },
          'Failed to send auto-cancel message'
        )
      }
    }

    await db
      .update(reservations)
      .set({ status: 'cancelled_auto', updatedAt: now })
      .where(eq(reservations.id, res.id))

    cancelledAutoCount++
  }

  return {
    processed: {
      firstReminder: firstReminderCount,
      escalated: escalatedCount,
      cancelledAuto: cancelledAutoCount,
    },
  }
})
