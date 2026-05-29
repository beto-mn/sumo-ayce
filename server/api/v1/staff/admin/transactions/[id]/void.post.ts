import { and, eq, isNull, sql } from 'drizzle-orm'
import { defineEventHandler, getRouterParam, readValidatedBody } from 'h3'
import { z } from 'zod'
import { customers, loyaltyTransactions } from '../../../../../../db/schema'
import { db } from '../../../../../../utils/db'
import {
  ConflictError,
  handleError,
  NotFoundError,
} from '../../../../../../utils/error-handler'
import { ok } from '../../../../../../utils/response'
import { requireStaffAuth } from '../../../../../../utils/staff-auth'

const bodySchema = z.object({
  reason: z.string().min(1).max(500),
})

export default defineEventHandler(async event => {
  try {
    const staffUser = await requireStaffAuth(event, 'admin')
    const id = getRouterParam(event, 'id') ?? ''
    const body = await readValidatedBody(event, v => bodySchema.parse(v))

    const [transaction] = await db
      .select()
      .from(loyaltyTransactions)
      .where(
        and(
          eq(loyaltyTransactions.id, id),
          eq(loyaltyTransactions.branchId, staffUser.branchId)
        )
      )
      .limit(1)

    if (!transaction) throw new NotFoundError('Transaction')
    if (transaction.deletedAt)
      throw new ConflictError('Transaction already voided')

    const now = new Date()

    await db.transaction(async (tx: typeof db) => {
      await tx
        .update(customers)
        .set({
          pointsBalance: sql`${customers.pointsBalance} - ${transaction.pointsDelta}`,
        })
        .where(eq(customers.id, transaction.customerId))

      await tx
        .update(loyaltyTransactions)
        .set({
          deletedAt: now,
          voidedBy: staffUser.id,
          voidedAt: now,
          voidReason: body.reason,
        })
        .where(eq(loyaltyTransactions.id, id))
    })

    const [updatedCustomer] = await db
      .select({ pointsBalance: customers.pointsBalance })
      .from(customers)
      .where(eq(customers.id, transaction.customerId))
      .limit(1)

    return ok({
      transactionId: id,
      voidedAt: now,
      voidedBy: staffUser.id,
      customerNewBalance: updatedCustomer?.pointsBalance ?? 0,
    })
  } catch (err) {
    throw handleError(err)
  }
})
