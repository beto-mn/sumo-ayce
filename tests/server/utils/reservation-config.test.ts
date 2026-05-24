import { afterEach, beforeEach, describe, expect, it } from 'vitest'

describe('reservationTimeouts', () => {
  beforeEach(() => {
    delete process.env.RESERVATION_FIRST_REMINDER_MIN
    delete process.env.RESERVATION_ESCALATION_MIN
    delete process.env.RESERVATION_AUTO_CANCEL_MIN
  })

  afterEach(() => {
    delete process.env.RESERVATION_FIRST_REMINDER_MIN
    delete process.env.RESERVATION_ESCALATION_MIN
    delete process.env.RESERVATION_AUTO_CANCEL_MIN
  })

  it('returns default values when env vars are not set', async () => {
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(reservationTimeouts.firstReminderMin).toBe(30)
    expect(reservationTimeouts.escalationMin).toBe(30)
    expect(reservationTimeouts.autoCancelMin).toBe(60)
  })

  it('parses values as integers', async () => {
    const { reservationTimeouts } = await import(
      '../../../server/utils/reservation-config'
    )
    expect(Number.isInteger(reservationTimeouts.firstReminderMin)).toBe(true)
    expect(Number.isInteger(reservationTimeouts.escalationMin)).toBe(true)
    expect(Number.isInteger(reservationTimeouts.autoCancelMin)).toBe(true)
  })
})
