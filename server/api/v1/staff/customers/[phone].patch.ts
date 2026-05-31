import { and, eq, isNull, ne } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody } from 'h3'
import { z } from 'zod'
import { customers } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import {
  ConflictError,
  handleError,
  NotFoundError,
} from '../../../../utils/error-handler'
import { ok } from '../../../../utils/response'
import { requireStaffAuth } from '../../../../utils/staff-auth'
import { normalizePhone } from '../../../../utils/twilio'

const bodySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    phone: z.string().min(1).optional(),
  })
  .refine(d => d.name !== undefined || d.phone !== undefined, {
    message: 'At least one field (name or phone) must be provided',
  })

export default defineEventHandler(async event => {
  try {
    await requireStaffAuth(event)
    const rawPhone = decodeURIComponent(event.context.params?.phone ?? '')
    const phone = normalizePhone(rawPhone)
    const body = await readValidatedBody(event, v => bodySchema.parse(v))

    const [customer] = await db
      .select()
      .from(customers)
      .where(and(eq(customers.phone, phone), isNull(customers.deletedAt)))
      .limit(1)

    if (!customer) throw new NotFoundError('Customer')

    const newPhone = body.phone ? normalizePhone(body.phone) : undefined

    if (newPhone && newPhone !== customer.phone) {
      const [conflict] = await db
        .select({ id: customers.id })
        .from(customers)
        .where(
          and(
            eq(customers.phone, newPhone),
            isNull(customers.deletedAt),
            ne(customers.id, customer.id)
          )
        )
        .limit(1)

      if (conflict) throw new ConflictError('Phone number already in use')
    }

    const [updated] = await db
      .update(customers)
      .set({
        ...(body.name !== undefined && { name: body.name }),
        ...(newPhone !== undefined && { phone: newPhone }),
        updatedAt: new Date(),
      })
      .where(eq(customers.id, customer.id))
      .returning()

    return ok({
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
      pointsBalance: updated.pointsBalance,
      whatsappOptIn: updated.whatsappOptIn,
    })
  } catch (err) {
    throw handleError(err)
  }
})
