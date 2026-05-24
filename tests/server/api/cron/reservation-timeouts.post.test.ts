import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const { mockSendWhatsAppMessage, mockGetHeader, mockSetResponseStatus } =
  vi.hoisted(() => ({
    mockSendWhatsAppMessage: vi.fn(),
    mockGetHeader: vi.fn(),
    mockSetResponseStatus: vi.fn(),
  }))

vi.mock('../../../../server/utils/twilio', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  normalizePhone: (p: string) => p,
}))

vi.mock('../../../../server/utils/env', () => ({
  env: {
    CRON_SECRET: 'test_cron_secret',
    TWILIO_AUTH_TOKEN: 'test_auth_token',
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
  },
}))

vi.mock('../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return {
    ...actual,
    getHeader: mockGetHeader,
    setResponseStatus: mockSetResponseStatus,
  }
})

import handler from '../../../../server/api/cron/reservation-timeouts.post'

const BRANCH_ID = '00000000-0000-0000-0000-000000000001'
const RES_ID_1 = '00000000-0000-0000-0000-000000000011'
const RES_ID_2 = '00000000-0000-0000-0000-000000000022'
const RES_ID_3 = '00000000-0000-0000-0000-000000000033'

const BRANCH_PRIMARY_ONLY = {
  id: BRANCH_ID,
  whatsappReservaciones: '+528111111111',
  whatsappReservacionesBackup: null,
}

const BRANCH_WITH_SECONDARY = {
  id: BRANCH_ID,
  whatsappReservaciones: '+528111111111',
  whatsappReservacionesBackup: '+528122222222',
}

function makePendingReservation(overrides = {}) {
  return {
    id: RES_ID_1,
    folio: 'AAAA1111',
    branchId: BRANCH_ID,
    contactName: 'Juan Pérez',
    contactPhone: '+528199999999',
    partySize: 4,
    reservationDate: '2026-07-01',
    reservationTime: '19:00:00',
    status: 'pending',
    firstReminderAt: null,
    escalatedAt: null,
    ...overrides,
  }
}

function makeEvent(): H3Event {
  return {} as unknown as H3Event
}

describe('POST /api/cron/reservation-timeouts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendWhatsAppMessage.mockResolvedValue(undefined)
  })

  it('returns 401 when Authorization header is missing', async () => {
    mockGetHeader.mockReturnValue(null)

    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('returns 401 when Authorization header has wrong secret', async () => {
    mockGetHeader.mockReturnValue('Bearer wrong_secret')

    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 401,
    })
  })

  it('sends reminder to primary and sets firstReminderAt for T+firstReminderMin reservation', async () => {
    mockGetHeader.mockReturnValue('Bearer test_cron_secret')
    const res = makePendingReservation({ firstReminderAt: null })
    // Query 1: pending, no firstReminderAt, old enough
    mockDb.select
      .mockReturnValueOnce(dbChain([res]))
      .mockReturnValueOnce(dbChain([BRANCH_PRIMARY_ONLY]))
      // Query 2: pending, firstReminderAt elapsed → empty
      .mockReturnValueOnce(dbChain([]))
      // Query 3: escalated, escalatedAt elapsed → empty
      .mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValue(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockDb.update).toHaveBeenCalledTimes(1)
    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(1)
    expect(mockSendWhatsAppMessage).toHaveBeenCalledWith(
      BRANCH_PRIMARY_ONLY.whatsappReservaciones,
      expect.any(String)
    )
    expect(result.processed.firstReminder).toBe(1)
    expect(result.processed.escalated).toBe(0)
    expect(result.processed.cancelledAuto).toBe(0)
  })

  it('escalates reservation: updates status to escalated, notifies primary and secondary', async () => {
    mockGetHeader.mockReturnValue('Bearer test_cron_secret')
    const res = makePendingReservation({
      id: RES_ID_2,
      folio: 'BBBB2222',
      firstReminderAt: new Date(Date.now() - 35 * 60 * 1000),
      status: 'pending',
    })
    // Query 1: no first-reminder candidates
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      // Query 2: pending, firstReminderAt elapsed
      .mockReturnValueOnce(dbChain([res]))
      .mockReturnValueOnce(dbChain([BRANCH_WITH_SECONDARY]))
      // Query 3: escalated, escalatedAt elapsed → empty
      .mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValue(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockDb.update).toHaveBeenCalledTimes(1)
    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(2)
    const calls = mockSendWhatsAppMessage.mock.calls.map(c => c[0])
    expect(calls).toContain(BRANCH_WITH_SECONDARY.whatsappReservaciones)
    expect(calls).toContain(BRANCH_WITH_SECONDARY.whatsappReservacionesBackup)
    expect(result.processed.firstReminder).toBe(0)
    expect(result.processed.escalated).toBe(1)
    expect(result.processed.cancelledAuto).toBe(0)
  })

  it('auto-cancels reservation: notifies client, primary, and secondary', async () => {
    mockGetHeader.mockReturnValue('Bearer test_cron_secret')
    const res = makePendingReservation({
      id: RES_ID_3,
      folio: 'CCCC3333',
      status: 'escalated',
      escalatedAt: new Date(Date.now() - 65 * 60 * 1000),
    })
    // Query 1: empty, Query 2: empty, Query 3: escalated, elapsed
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([res]))
      .mockReturnValueOnce(dbChain([BRANCH_WITH_SECONDARY]))
    mockDb.update.mockReturnValue(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockDb.update).toHaveBeenCalledTimes(1)
    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(3)
    const recipients = mockSendWhatsAppMessage.mock.calls.map(c => c[0])
    expect(recipients).toContain(res.contactPhone)
    expect(recipients).toContain(BRANCH_WITH_SECONDARY.whatsappReservaciones)
    expect(recipients).toContain(
      BRANCH_WITH_SECONDARY.whatsappReservacionesBackup
    )
    expect(result.processed.cancelledAuto).toBe(1)
  })

  it('auto-cancels without secondary: only notifies client and primary', async () => {
    mockGetHeader.mockReturnValue('Bearer test_cron_secret')
    const res = makePendingReservation({
      id: RES_ID_3,
      folio: 'DDDD4444',
      status: 'escalated',
      escalatedAt: new Date(Date.now() - 65 * 60 * 1000),
    })
    mockDb.select
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([]))
      .mockReturnValueOnce(dbChain([res]))
      .mockReturnValueOnce(dbChain([BRANCH_PRIMARY_ONLY]))
    mockDb.update.mockReturnValue(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockSendWhatsAppMessage).toHaveBeenCalledTimes(2)
    expect(result.processed.cancelledAuto).toBe(1)
  })

  it('returns correct counts when multiple reservations processed in one run', async () => {
    mockGetHeader.mockReturnValue('Bearer test_cron_secret')
    const r1 = makePendingReservation({ id: RES_ID_1, folio: 'AAAA1111' })
    const r2 = makePendingReservation({
      id: RES_ID_2,
      folio: 'BBBB2222',
      firstReminderAt: new Date(),
    })
    mockDb.select
      // Query 1: 1 first-reminder candidate
      .mockReturnValueOnce(dbChain([r1]))
      .mockReturnValueOnce(dbChain([BRANCH_PRIMARY_ONLY]))
      // Query 2: 1 escalation candidate
      .mockReturnValueOnce(dbChain([r2]))
      .mockReturnValueOnce(dbChain([BRANCH_PRIMARY_ONLY]))
      // Query 3: 0 auto-cancel candidates
      .mockReturnValueOnce(dbChain([]))
    mockDb.update.mockReturnValue(dbChain([]))

    const result = await handler(makeEvent())

    expect(result.processed.firstReminder).toBe(1)
    expect(result.processed.escalated).toBe(1)
    expect(result.processed.cancelledAuto).toBe(0)
  })
})
