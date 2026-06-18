import { and, eq, isNull, sql } from 'drizzle-orm'
import {
  createError,
  defineEventHandler,
  readValidatedBody,
  setResponseStatus,
} from 'h3'
import { z } from 'zod'
import {
  customers,
  loyaltyTransactions,
  redemptions,
  rewards,
  staffUsers,
} from '../../../../db/schema'
import { db } from '../../../../utils/db'
import {
  ConflictError,
  ForbiddenError,
  handleError,
  NotFoundError,
  UnprocessableError,
} from '../../../../utils/error-handler'
import { logger } from '../../../../utils/logger'
import { msgLoyaltyCanje } from '../../../../utils/loyalty-messages'
import { ok } from '../../../../utils/response'
import { normalizePhone, sendWhatsAppMessage } from '../../../../utils/twilio'

const bodySchema = z.object({
  phone: z.string().min(1),
  rewardId: z.string().uuid(),
  branchId: z.string().uuid(),
  ticketId: z.string().min(1).max(100),
  staffId: z.string().uuid(),
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

    const [reward] = await db
      .select()
      .from(rewards)
      .where(eq(rewards.id, body.rewardId))

    if (!reward) throw new NotFoundError('Reward')
    if (!reward.isActive) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Reward is not available',
      })
    }

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

    const [earnRecord] = await db
      .select({ createdBy: loyaltyTransactions.createdBy })
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.ticketId, body.ticketId),
          eq(loyaltyTransactions.transactionType, 'earn')
        )
      )

    if (earnRecord?.createdBy && earnRecord.createdBy === body.staffId) {
      throw new ForbiddenError(
        'Same staff cannot earn and redeem on the same ticket — requires a second staff member'
      )
    }

    let redemptionRow: typeof redemptions.$inferSelect
    let remainingBalance: number

    try {
      const result = await db.transaction(async (tx: typeof db) => {
        const [fresh] = await tx
          .select()
          .from(customers)
          .where(eq(customers.id, customer.id))
          .for('update')

        if (fresh.pointsBalance < reward.pointsCost) {
          throw new UnprocessableError('Insufficient points')
        }

        const [row] = await tx
          .insert(redemptions)
          .values({
            customerId: customer.id,
            rewardId: body.rewardId,
            branchId: body.branchId,
            ticketId: body.ticketId,
            createdBy: body.staffId,
            status: 'used',
            usedAt: new Date(),
          })
          .returning()

        await tx
          .update(customers)
          .set({
            pointsBalance: sql`${customers.pointsBalance} - ${reward.pointsCost}`,
          })
          .where(eq(customers.id, customer.id))

        await tx.insert(loyaltyTransactions).values({
          customerId: customer.id,
          branchId: body.branchId,
          pointsDelta: -reward.pointsCost,
          transactionType: 'redeem',
          referenceId: row.id,
          ticketId: body.ticketId,
          createdBy: body.staffId,
        })

        return { row, balance: fresh.pointsBalance - reward.pointsCost }
      })

      redemptionRow = result.row
      remainingBalance = result.balance
    } catch (err) {
      if (err instanceof UnprocessableError) throw err
      if (isUniqueViolation(err)) throw new ConflictError('Ticket already used')
      throw err
    }

    if (customer.whatsappOptIn) {
      sendWhatsAppMessage(
        customer.phone,
        msgLoyaltyCanje(
          customer.name,
          reward.name,
          reward.description,
          remainingBalance
        )
      ).catch(err =>
        logger.error({ err }, 'Failed to send redemption WhatsApp')
      )
    }

    setResponseStatus(event, 201)
    return ok({
      redemptionId: redemptionRow?.id,
      customerId: customer.id,
      rewardId: body.rewardId,
      rewardName: reward.name,
      ticketId: body.ticketId,
      pointsDeducted: reward.pointsCost,
      remainingBalance,
      status: 'used' as const,
      usedAt: redemptionRow?.usedAt,
      createdBy: body.staffId,
      createdAt: redemptionRow?.createdAt,
    })
  } catch (err) {
    throw handleError(err)
  }
})
