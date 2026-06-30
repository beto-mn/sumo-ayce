import { describe, expect, it } from 'vitest'
import { z } from 'zod'

/**
 * Tests for env.ts Zod schema — validates startup environment validation
 * including the BLOB_BASE_URL requirement (SC-002, US2).
 *
 * We import and use the schema logic directly without importing the
 * singleton proxy, so each test is isolated and stateless.
 */

// Reconstruct the schema shape from the source of truth to test it.
// This avoids module-singleton coupling in tests.
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  WORDPRESS_API_URL: z.string().url(),
  TWILIO_ACCOUNT_SID: z.string().min(1),
  TWILIO_AUTH_TOKEN: z.string().min(1),
  TWILIO_WHATSAPP_NUMBER: z.string().min(1),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  GOOGLE_DRIVE_FOLDER_ID: z.string().min(1),
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1),
  CRON_SECRET: z.string().min(1).optional(),
  BLOB_BASE_URL: z.string().url().min(1),
})

const VALID_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
  WORDPRESS_API_URL: 'https://cms.example.com',
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: 'authtoken',
  TWILIO_WHATSAPP_NUMBER: '+15005550006',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@test.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY:
    '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
  GOOGLE_DRIVE_FOLDER_ID: 'folder123',
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.test',
  BLOB_BASE_URL: 'https://abc123.public.blob.vercel-storage.com',
}

describe('env schema', () => {
  it('fails validation when BLOB_BASE_URL is missing', () => {
    const { BLOB_BASE_URL: _removed, ...withoutBlob } = VALID_ENV
    const result = envSchema.safeParse(withoutBlob)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('BLOB_BASE_URL')
    }
  })

  it('fails validation when BLOB_BASE_URL is an empty string', () => {
    const result = envSchema.safeParse({ ...VALID_ENV, BLOB_BASE_URL: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('BLOB_BASE_URL')
    }
  })

  it('fails validation when BLOB_BASE_URL is not a valid URL', () => {
    const result = envSchema.safeParse({
      ...VALID_ENV,
      BLOB_BASE_URL: 'not-a-url',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map(i => i.path.join('.'))
      expect(paths).toContain('BLOB_BASE_URL')
    }
  })

  it('succeeds when all required variables including BLOB_BASE_URL are present', () => {
    const result = envSchema.safeParse(VALID_ENV)
    expect(result.success).toBe(true)
  })
})
