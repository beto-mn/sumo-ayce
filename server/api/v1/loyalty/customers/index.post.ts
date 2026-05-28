import { eq } from 'drizzle-orm'
import { defineEventHandler, readValidatedBody, setResponseStatus } from 'h3'
import { z } from 'zod'
import { customers } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { ConflictError, handleError } from '../../../../utils/error-handler'
import { logger } from '../../../../utils/logger'
import { msgLoyaltyBienvenida } from '../../../../utils/loyalty-messages'
import { ok } from '../../../../utils/response'
import { normalizePhone, sendWhatsAppMessage } from '../../../../utils/twilio'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(1),
  whatsappOptIn: z.boolean().default(false),
})

export default defineEventHandler(async event => {
  try {
    const body = await readValidatedBody(event, v => bodySchema.parse(v))
    const phone = normalizePhone(body.phone)

    const [existing] = await db
      .select()
      .from(customers)
      .where(eq(customers.phone, phone))

    if (existing) {
      throw new ConflictError('Customer already registered')
    }

    const [customer] = await db
      .insert(customers)
      .values({ name: body.name, phone, whatsappOptIn: body.whatsappOptIn })
      .returning()

    if (body.whatsappOptIn) {
      sendWhatsAppMessage(phone, msgLoyaltyBienvenida(body.name)).catch(err =>
        logger.error({ err }, 'Failed to send welcome WhatsApp')
      )
    }

    setResponseStatus(event, 201)
    return ok(customer)
  } catch (err) {
    throw handleError(err)
  }
})
