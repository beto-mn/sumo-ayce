import { and, count, eq, gte, isNull, lt, not, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import {
  branches,
  customers,
  loyaltyTransactions,
  redemptions,
} from '../../../../../db/schema'
import { db } from '../../../../../utils/db'
import { handleError } from '../../../../../utils/error-handler'
import { ok } from '../../../../../utils/response'
import { requireStaffAuth } from '../../../../../utils/staff-auth'

const querySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
})

export default defineEventHandler(async event => {
  try {
    const staffUser = await requireStaffAuth(event, 'admin')
    const rawQuery = getQuery(event)
    const query = querySchema.parse(rawQuery)

    const dateStr = query.date ?? new Date().toISOString().slice(0, 10)
    const dayStart = new Date(`${dateStr}T00:00:00`)
    const dayEnd = new Date(`${dateStr}T23:59:59.999`)

    const branchCondition = eq(loyaltyTransactions.branchId, staffUser.branchId)
    const dayCondition = and(
      gte(loyaltyTransactions.createdAt, dayStart),
      lt(loyaltyTransactions.createdAt, dayEnd)
    )

    const [visitsRow] = await db
      .select({ count: count() })
      .from(loyaltyTransactions)
      .where(
        and(
          branchCondition,
          dayCondition,
          eq(loyaltyTransactions.transactionType, 'earn'),
          isNull(loyaltyTransactions.deletedAt)
        )
      )

    const [pointsRow] = await db
      .select({
        total: sql<number>`coalesce(sum(${loyaltyTransactions.pointsDelta}), 0)`,
      })
      .from(loyaltyTransactions)
      .where(
        and(
          branchCondition,
          dayCondition,
          eq(loyaltyTransactions.transactionType, 'earn'),
          isNull(loyaltyTransactions.deletedAt)
        )
      )

    const [redemptionsRow] = await db
      .select({ count: count() })
      .from(redemptions)
      .where(
        and(
          eq(redemptions.branchId, staffUser.branchId),
          gte(redemptions.createdAt, dayStart),
          lt(redemptions.createdAt, dayEnd)
        )
      )

    const [pointsRedeemedRow] = await db
      .select({
        total: sql<number>`coalesce(sum(abs(${loyaltyTransactions.pointsDelta})), 0)`,
      })
      .from(loyaltyTransactions)
      .where(
        and(
          branchCondition,
          dayCondition,
          eq(loyaltyTransactions.transactionType, 'redeem'),
          isNull(loyaltyTransactions.deletedAt)
        )
      )

    const [newCustomersRow] = await db
      .select({ count: count() })
      .from(customers)
      .where(
        and(gte(customers.createdAt, dayStart), lt(customers.createdAt, dayEnd))
      )

    const [voidedRow] = await db
      .select({ count: count() })
      .from(loyaltyTransactions)
      .where(
        and(
          branchCondition,
          dayCondition,
          not(isNull(loyaltyTransactions.deletedAt))
        )
      )

    const [branch] = await db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.id, staffUser.branchId))
      .limit(1)

    return ok({
      date: dateStr,
      branchId: staffUser.branchId,
      branchName: branch?.name ?? null,
      visitsCount: visitsRow.count,
      pointsEarned: Number(pointsRow.total),
      redemptionsCount: redemptionsRow.count,
      pointsRedeemed: Number(pointsRedeemedRow.total),
      newCustomers: newCustomersRow.count,
      voidedCount: voidedRow.count,
    })
  } catch (err) {
    throw handleError(err)
  }
})
