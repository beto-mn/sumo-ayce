import { eq } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { z } from 'zod'
import { customers } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { ConflictError, handleError } from '../../../../utils/error-handler'
import { logger } from '../../../../utils/logger'
import { ok } from '../../../../utils/response'
import { requireStaffAuth } from '../../../../utils/staff-auth'
import { normalizePhone, sendWhatsAppMessage } from '../../../../utils/twilio'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1),
  whatsappOptIn: z.boolean().default(false),
})

export default defineEventHandler(async event => {
  try {
    await requireStaffAuth(event)
    const body = await readValidatedBody(event, v => bodySchema.parse(v))
    const phone = normalizePhone(body.phone)

    const [existing] = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        pointsBalance: customers.pointsBalance,
        whatsappOptIn: customers.whatsappOptIn,
        createdAt: customers.createdAt,
      })
      .from(customers)
      .where(eq(customers.phone, phone))
      .limit(1)

    if (existing) {
      throw Object.assign(new ConflictError('Phone already registered'), {
        data: existing,
      })
    }

    const [newCustomer] = await db
      .insert(customers)
      .values({ name: body.name, phone, whatsappOptIn: body.whatsappOptIn })
      .returning()

    if (body.whatsappOptIn) {
      sendWhatsAppMessage(
        phone,
        `¡Bienvenido a SUMO Loyalty, ${body.name}! 🎉 Ya eres parte del programa. Empieza a acumular puntos en tu próxima visita.`
      ).catch(err => logger.error({ err }, 'Failed to send welcome WhatsApp'))
    }

    setResponseStatus(event, 201)
    return ok({
      id: newCustomer.id,
      name: newCustomer.name,
      phone: newCustomer.phone,
      pointsBalance: newCustomer.pointsBalance,
      whatsappOptIn: newCustomer.whatsappOptIn,
    })
  } catch (err) {
    throw handleError(err)
  }
})
