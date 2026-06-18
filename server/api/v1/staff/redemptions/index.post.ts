import { and, count, eq, gte, isNull, sql } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { z } from 'zod'
import { customers, redemptions, rewards } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import {
  ConflictError,
  handleError,
  NotFoundError,
} from '../../../../utils/error-handler'
import { logger } from '../../../../utils/logger'
import { msgLoyaltyCanje } from '../../../../utils/loyalty-messages'
import { ok } from '../../../../utils/response'
import { requireStaffAuth } from '../../../../utils/staff-auth'
import { normalizePhone, sendWhatsAppMessage } from '../../../../utils/twilio'

const bodySchema = z.object({
  phone: z.string().min(1),
  rewardId: z.string().uuid(),
  ticketId: z.string().min(1).max(100),
})

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as Record<string, unknown>
  if (e.code === '23505') return true
  const cause = e.cause
  return (
    typeof cause === 'object' &&
    cause !== null &&
    (cause as Record<string, unknown>).code === '23505'
  )
}

export default defineEventHandler(async event => {
  try {
    const staffUser = await requireStaffAuth(event)
    const body = await readValidatedBody(event, v => bodySchema.parse(v))
    const phone = normalizePhone(body.phone)

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))
      .limit(1)

    if (!customer) throw new NotFoundError('Customer')

    const [reward] = await db
      .select()
      .from(rewards)
      .where(and(eq(rewards.id, body.rewardId), eq(rewards.isActive, true)))
      .limit(1)

    if (!reward) throw new NotFoundError('Reward')

    const [{ count: todayCount }] = await db
      .select({ count: count() })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.customerId, customer.id),
          gte(redemptions.createdAt, sql`CURRENT_DATE`)
        )
      )

    if (Number(todayCount) > 0) {
      throw new ConflictError('Customer already redeemed a reward today')
    }

    if (customer.pointsBalance < reward.pointsCost) {
      throw new ConflictError(
        `Insufficient points: needs ${reward.pointsCost}, has ${customer.pointsBalance}`
      )
    }

    let redemptionRow: typeof redemptions.$inferSelect | undefined

    try {
      await db.transaction(async (tx: typeof db) => {
        await tx
          .update(customers)
          .set({
            pointsBalance: sql`${customers.pointsBalance} - ${reward.pointsCost}`,
          })
          .where(eq(customers.id, customer.id))

        const [row] = await tx
          .insert(redemptions)
          .values({
            customerId: customer.id,
            rewardId: reward.id,
            branchId: staffUser.branchId,
            ticketId: body.ticketId,
            createdBy: staffUser.id,
            usedBy: staffUser.id,
            status: 'used',
            usedAt: new Date(),
          })
          .returning()

        redemptionRow = row
      })
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Ticket already used')
      throw err
    }

    const newBalance = customer.pointsBalance - reward.pointsCost

    if (customer.whatsappOptIn) {
      sendWhatsAppMessage(
        customer.phone,
        msgLoyaltyCanje(
          customer.name,
          reward.name,
          reward.description,
          newBalance
        )
      ).catch(err => logger.error({ err }, 'Failed to send redeem WhatsApp'))
    }

    setResponseStatus(event, 201)
    return ok({
      redemptionId: redemptionRow?.id,
      customerId: customer.id,
      rewardId: reward.id,
      rewardName: reward.name,
      pointsSpent: reward.pointsCost,
      newBalance,
      ticketId: body.ticketId,
      createdAt: redemptionRow?.createdAt,
    })
  } catch (err) {
    throw handleError(err)
  }
})
