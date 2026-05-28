import { and, count, eq, gte, isNull, sql } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { z } from 'zod'
import {
  branches,
  customers,
  loyaltyTransactions,
  rewards,
  staffUsers,
} from '../../../../db/schema'
import { db } from '../../../../utils/db'
import {
  ConflictError,
  ForbiddenError,
  handleError,
  NotFoundError,
} from '../../../../utils/error-handler'
import { logger } from '../../../../utils/logger'
import { loyaltyConfig } from '../../../../utils/loyalty-config'
import {
  msgLoyaltyPuntosGanados,
  msgLoyaltyRecompensasDesbloqueadas,
  msgLoyaltyVelocityAlert,
} from '../../../../utils/loyalty-messages'
import { ok } from '../../../../utils/response'
import { normalizePhone, sendWhatsAppMessage } from '../../../../utils/twilio'

const bodySchema = z.object({
  phone: z.string().min(1),
  branchId: z.string().uuid(),
  ticketId: z.string().min(1).max(100),
  staffId: z.string().uuid(),
  points: z.number().int().positive(),
})

function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false
  const e = err as Record<string, unknown>
  if (e.code === '23505') return true
  // Drizzle wraps PG errors: DrizzleQueryError { cause: PgError { code } }
  const cause = e.cause
  return (
    typeof cause === 'object' &&
    cause !== null &&
    (cause as Record<string, unknown>).code === '23505'
  )
}

export default defineEventHandler(async event => {
  try {
    const body = await readValidatedBody(event, v => bodySchema.parse(v))
    const phone = normalizePhone(body.phone)

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))

    if (!customer) throw new NotFoundError('Customer')

    const [staff] = await db
      .select({
        id: staffUsers.id,
        name: staffUsers.name,
        phone: staffUsers.phone,
      })
      .from(staffUsers)
      .where(eq(staffUsers.id, body.staffId))

    if (staff?.phone && staff.phone === customer.phone) {
      throw new ForbiddenError('Staff cannot process own account')
    }

    const [{ count: todayCount }] = await db
      .select({ count: count() })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.customerId, customer.id),
          eq(loyaltyTransactions.transactionType, 'earn'),
          gte(loyaltyTransactions.createdAt, sql`CURRENT_DATE`)
        )
      )

    if (Number(todayCount) > 0) {
      throw new ConflictError('Customer already earned points today')
    }

    const activeRewards = await db
      .select({
        id: rewards.id,
        name: rewards.name,
        description: rewards.description,
        pointsCost: rewards.pointsCost,
      })
      .from(rewards)
      .where(eq(rewards.isActive, true))

    const prevBalance = customer.pointsBalance
    const delta = body.points
    let transactionRow: typeof loyaltyTransactions.$inferSelect | undefined

    try {
      await db.transaction(async (tx: typeof db) => {
        await tx
          .update(customers)
          .set({ pointsBalance: sql`${customers.pointsBalance} + ${delta}` })
          .where(eq(customers.id, customer.id))

        const [row] = await tx
          .insert(loyaltyTransactions)
          .values({
            customerId: customer.id,
            branchId: body.branchId,
            pointsDelta: delta,
            transactionType: 'earn',
            ticketId: body.ticketId,
            createdBy: body.staffId,
          })
          .returning()

        transactionRow = row
      })
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictError('Ticket already used')
      throw err
    }

    const newBalance = prevBalance + delta

    if (customer.whatsappOptIn) {
      sendWhatsAppMessage(
        customer.phone,
        msgLoyaltyPuntosGanados(customer.name, delta, newBalance)
      ).catch(err => logger.error({ err }, 'Failed to send earn WhatsApp'))

      const unlocked = activeRewards.filter(
        (r: (typeof activeRewards)[0]) =>
          r.pointsCost > prevBalance && r.pointsCost <= newBalance
      )
      if (unlocked.length > 0) {
        sendWhatsAppMessage(
          customer.phone,
          msgLoyaltyRecompensasDesbloqueadas(unlocked)
        ).catch(err => logger.error({ err }, 'Failed to send unlock WhatsApp'))
      }
    }

    if (loyaltyConfig.velocityThreshold > 0) {
      const windowStart = new Date(Date.now() - 60 * 60 * 1000)
      const [{ count: recentCount }] = await db
        .select({ count: count() })
        .from(loyaltyTransactions)
        .where(
          and(
            eq(loyaltyTransactions.createdBy, body.staffId),
            eq(loyaltyTransactions.transactionType, 'earn'),
            gte(loyaltyTransactions.createdAt, windowStart)
          )
        )

      if (Number(recentCount) >= loyaltyConfig.velocityThreshold) {
        const [branch] = await db
          .select({ name: branches.name, managerPhone: branches.managerPhone })
          .from(branches)
          .where(eq(branches.id, body.branchId))

        if (branch?.managerPhone) {
          sendWhatsAppMessage(
            branch.managerPhone,
            msgLoyaltyVelocityAlert(
              staff?.name ?? body.staffId,
              body.staffId,
              Number(recentCount),
              60,
              branch.name
            )
          ).catch(err => logger.error({ err }, 'Failed to send velocity alert'))
        }
      }
    }

    setResponseStatus(event, 201)
    return ok({
      transactionId: transactionRow?.id,
      customerId: customer.id,
      pointsDelta: delta,
      newBalance,
      transactionType: 'earn' as const,
      branchId: body.branchId,
      ticketId: body.ticketId,
      createdBy: body.staffId,
      createdAt: transactionRow?.createdAt,
    })
  } catch (err) {
    throw handleError(err)
  }
})
