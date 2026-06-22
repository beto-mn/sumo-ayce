import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1),

  // WordPress
  WORDPRESS_API_URL: z.string().url(),

  // Twilio
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1),

  // Google Drive
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  GOOGLE_DRIVE_FOLDER_ID: z.string().min(1),

  // Mapbox
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1),

  // Cron
  CRON_SECRET: z.string().min(1).optional(),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const missing = parsed.error.issues.map(i => i.path.join('.')).join(', ')
  throw new Error(`Missing or invalid environment variables: ${missing}`)
}

export const env = parsed.data
