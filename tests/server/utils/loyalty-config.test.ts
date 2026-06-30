import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const REQUIRED_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
  WORDPRESS_API_URL: 'https://cms.example.com',
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: 'authtoken',
  TWILIO_WHATSAPP_NUMBER: '+15005550006',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@test.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: 'key',
  GOOGLE_DRIVE_FOLDER_ID: 'folder123',
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.test',
  BLOB_BASE_URL: 'https://abc123.public.blob.vercel-storage.com',
}

describe('loyaltyConfig', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_ENV,
    }
    delete process.env.LOYALTY_POINTS_PER_VISIT
    delete process.env.LOYALTY_VELOCITY_THRESHOLD
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('defaults pointsPerVisit to 1 when env is absent', async () => {
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(1)
  })

  it('reads pointsPerVisit from env', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '25'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.pointsPerVisit).toBe(25)
  })

  it('throws at startup when LOYALTY_POINTS_PER_VISIT is 0 (not positive)', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '0'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(() => loyaltyConfig.pointsPerVisit).toThrow(
      /Missing or invalid environment variables/
    )
  })

  it('throws at startup when LOYALTY_POINTS_PER_VISIT is negative', async () => {
    process.env.LOYALTY_POINTS_PER_VISIT = '-5'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(() => loyaltyConfig.pointsPerVisit).toThrow(
      /Missing or invalid environment variables/
    )
  })

  it('defaults velocityThreshold to 5 when env is absent', async () => {
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(5)
  })

  it('reads velocityThreshold from env', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '1'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(1)
  })

  it('returns 0 when LOYALTY_VELOCITY_THRESHOLD=0 (feature disabled)', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '0'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(loyaltyConfig.velocityThreshold).toBe(0)
  })

  it('throws at startup when LOYALTY_VELOCITY_THRESHOLD is negative', async () => {
    process.env.LOYALTY_VELOCITY_THRESHOLD = '-1'
    const { loyaltyConfig } = await import(
      '../../../server/utils/loyalty-config'
    )
    expect(() => loyaltyConfig.velocityThreshold).toThrow(
      /Missing or invalid environment variables/
    )
  })
})
