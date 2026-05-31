import { and, eq, isNull } from 'drizzle-orm'
import { defineEventHandler, getRouterParam } from 'h3'
import { customers } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { handleError, NotFoundError } from '../../../../utils/error-handler'
import { ok } from '../../../../utils/response'
import { requireStaffAuth } from '../../../../utils/staff-auth'
import { normalizePhone } from '../../../../utils/twilio'

export default defineEventHandler(async event => {
  try {
    await requireStaffAuth(event)

    const rawPhone = getRouterParam(event, 'phone') ?? ''
    const phone = normalizePhone(rawPhone)

    const [customer] = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        pointsBalance: customers.pointsBalance,
        whatsappOptIn: customers.whatsappOptIn,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))
      .limit(1)

    if (!customer) throw new NotFoundError('Customer')

    return ok(customer)
  } catch (err) {
    throw handleError(err)
  }
})
