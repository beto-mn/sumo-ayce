import twilio from 'twilio'
import { env } from './env'
import { ExternalServiceError } from './error-handler'
import { logger } from './logger'

let _client: ReturnType<typeof twilio> | null = null

function getClient() {
  if (!_client) {
    _client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)
  }
  return _client
}

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return `+521${digits}`
  if (digits.length === 12 && digits.startsWith('52'))
    return `+521${digits.slice(2)}`
  if (digits.length === 13 && digits.startsWith('521')) return `+${digits}`
  if (raw.startsWith('+')) return raw.replace(/\s/g, '')
  return `+${digits}`
}

export async function sendWhatsAppMessage(
  to: string,
  body: string
): Promise<void> {
  const normalized = normalizePhone(to)
  try {
    await getClient().messages.create({
      from: env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${normalized}`,
      body,
    })
  } catch (error) {
    logger.error({ error, to: normalized }, 'Twilio send failed')
    throw new ExternalServiceError('Twilio', error)
  }
}

export function verifyTwilioSignature(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  return twilio.validateRequest(authToken, signature, url, params)
}
