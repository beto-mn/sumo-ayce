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

describe('reservationTimeouts', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_ENV,
    }
    delete process.env.RESERVATION_FIRST_REMINDER_MIN
    delete process.env.RESERVATION_ESCALATION_MIN
    delete process.env.RESERVATION_AUTO_CANCEL_MIN
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  it('returns default values when env vars are not set', async () => {
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(reservationTimeouts.firstReminderMin).toBe(5)
    expect(reservationTimeouts.escalationMin).toBe(5)
    expect(reservationTimeouts.autoCancelMin).toBe(20)
  })

  it('parses values as integers', async () => {
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(Number.isInteger(reservationTimeouts.firstReminderMin)).toBe(true)
    expect(Number.isInteger(reservationTimeouts.escalationMin)).toBe(true)
    expect(Number.isInteger(reservationTimeouts.autoCancelMin)).toBe(true)
  })

  it('reads custom values from env', async () => {
    process.env.RESERVATION_FIRST_REMINDER_MIN = '10'
    process.env.RESERVATION_ESCALATION_MIN = '15'
    process.env.RESERVATION_AUTO_CANCEL_MIN = '30'
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(reservationTimeouts.firstReminderMin).toBe(10)
    expect(reservationTimeouts.escalationMin).toBe(15)
    expect(reservationTimeouts.autoCancelMin).toBe(30)
  })

  it('throws at startup when a timeout value is non-numeric', async () => {
    process.env.RESERVATION_FIRST_REMINDER_MIN = 'abc'
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(() => reservationTimeouts.firstReminderMin).toThrow(
      /Missing or invalid environment variables/
    )
  })
})
