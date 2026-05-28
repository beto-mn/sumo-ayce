import { and, desc, eq, isNull } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { customers, loyaltyTransactions } from '../../../../../db/schema'
import { db } from '../../../../../utils/db'
import { handleError, NotFoundError } from '../../../../../utils/error-handler'
import { ok } from '../../../../../utils/response'
import { normalizePhone } from '../../../../../utils/twilio'

export default defineEventHandler(async event => {
  try {
    const rawPhone = getRouterParam(event, 'phone') ?? ''
    const phone = normalizePhone(rawPhone)

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))

    if (!customer) throw new NotFoundError('Customer')

    const transactions = await db
      .select({
        id: loyaltyTransactions.id,
        transactionType: loyaltyTransactions.transactionType,
        pointsDelta: loyaltyTransactions.pointsDelta,
        branchId: loyaltyTransactions.branchId,
        ticketId: loyaltyTransactions.ticketId,
        createdBy: loyaltyTransactions.createdBy,
        createdAt: loyaltyTransactions.createdAt,
      })
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.customerId, customer.id))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(20)

    return ok({ ...customer, transactions })
  } catch (err) {
    throw handleError(err)
  }
})
