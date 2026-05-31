import { and, asc, desc, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import {
  customers,
  loyaltyTransactions,
  staffUsers,
} from '../../../../../db/schema'
import { db } from '../../../../../utils/db'
import { handleError } from '../../../../../utils/error-handler'
import { ok } from '../../../../../utils/response'
import { requireStaffAuth } from '../../../../../utils/staff-auth'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  type: z.enum(['earn', 'redeem']).optional(),
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

    const offset = (query.page - 1) * query.limit

    const conditions = [eq(loyaltyTransactions.branchId, staffUser.branchId)]

    if (query.type) {
      conditions.push(eq(loyaltyTransactions.transactionType, query.type))
    }

    if (query.date) {
      const start = new Date(`${query.date}T00:00:00`)
      const end = new Date(`${query.date}T23:59:59.999`)
      conditions.push(gte(loyaltyTransactions.createdAt, start))
      conditions.push(lt(loyaltyTransactions.createdAt, end))
    }

    const [{ total }] = await db
      .select({ total: sql<number>`count(*)` })
      .from(loyaltyTransactions)
      .where(and(...conditions))

    const rows = await db
      .select({
        id: loyaltyTransactions.id,
        type: loyaltyTransactions.transactionType,
        pointsDelta: loyaltyTransactions.pointsDelta,
        ticketId: loyaltyTransactions.ticketId,
        voidedAt: loyaltyTransactions.voidedAt,
        createdAt: loyaltyTransactions.createdAt,
        customerId: customers.id,
        customerName: customers.name,
        customerPhone: customers.phone,
        staffId: staffUsers.id,
        staffName: staffUsers.name,
      })
      .from(loyaltyTransactions)
      .innerJoin(customers, eq(loyaltyTransactions.customerId, customers.id))
      .leftJoin(staffUsers, eq(loyaltyTransactions.createdBy, staffUsers.id))
      .where(and(...conditions))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(query.limit)
      .offset(offset)

    const transactions = rows.map((r: (typeof rows)[0]) => ({
      id: r.id,
      type: r.type,
      pointsDelta: r.pointsDelta,
      ticketId: r.ticketId,
      voidedAt: r.voidedAt,
      createdAt: r.createdAt,
      customer: {
        id: r.customerId,
        name: r.customerName,
        phone: r.customerPhone,
      },
      createdBy: r.staffId ? { id: r.staffId, name: r.staffName } : null,
    }))

    return ok({
      transactions,
      total: Number(total),
      page: query.page,
      limit: query.limit,
    })
  } catch (err) {
    throw handleError(err)
  }
})
