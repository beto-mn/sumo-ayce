import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { dbChain, mockDb } from '../../../mocks/db'

vi.mock('../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../mocks/db')
  return { db: mockDb }
})

const {
  mockSendWhatsAppMessage,
  mockVerifyTwilioSignature,
  mockGetHeader,
  mockReadRawBody,
  mockSetResponseStatus,
} = vi.hoisted(() => ({
  mockSendWhatsAppMessage: vi.fn(),
  mockVerifyTwilioSignature: vi.fn(),
  mockGetHeader: vi.fn(),
  mockReadRawBody: vi.fn(),
  mockSetResponseStatus: vi.fn(),
}))

vi.mock('../../../../server/utils/twilio', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  verifyTwilioSignature: mockVerifyTwilioSignature,
  normalizePhone: (p: string) => p.replace('whatsapp:', ''),
}))

vi.mock('../../../../server/utils/env', () => ({
  env: {
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
    readRawBody: mockReadRawBody,
    setResponseStatus: mockSetResponseStatus,
    setResponseHeader: vi.fn(),
  }
})

import handler from '../../../../server/api/webhooks/twilio.post'

const FOLIO = 'A3F9B21C'
const FROM = '+528112345678'
const BRANCH_ID = '00000000-0000-0000-0000-000000000001'

const PENDING_RESERVATION = {
  id: '00000000-0000-0000-0000-000000000099',
  folio: FOLIO,
  branchId: BRANCH_ID,
  contactName: 'Juan Pérez',
  contactPhone: '+528199999999',
  partySize: 4,
  reservationDate: '2026-07-01',
  reservationTime: '19:00:00',
  status: 'pending',
}

const BRANCH_DETAILS = {
  name: 'Sucursal Centro',
}

function makeEvent(
  requestUrl = 'https://app.test/api/webhooks/twilio'
): H3Event {
  return {
    node: { req: { url: requestUrl, headers: { host: 'app.test' } } },
  } as unknown as H3Event
}

describe('POST /api/webhooks/twilio', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockVerifyTwilioSignature.mockReturnValue(true)
    mockSendWhatsAppMessage.mockResolvedValue(undefined)
  })

  it('returns 403 when Twilio signature is invalid', async () => {
    mockGetHeader.mockReturnValue(null)
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A${encodeURIComponent(FROM)}&Body=ACEPTAR+${FOLIO}`
    )
    mockVerifyTwilioSignature.mockReturnValue(false)

    await expect(handler(makeEvent())).rejects.toMatchObject({
      statusCode: 403,
    })
  })

  it('updates status to confirmed and notifies client on ACEPTAR', async () => {
    mockGetHeader.mockReturnValue('valid_sig')
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A%2B528112345678&Body=ACEPTAR+${FOLIO}`
    )
    mockDb.select
      .mockReturnValueOnce(dbChain([PENDING_RESERVATION]))
      .mockReturnValueOnce(dbChain([BRANCH_DETAILS]))
    mockDb.update.mockReturnValueOnce(
      dbChain([{ ...PENDING_RESERVATION, status: 'confirmed' }])
    )

    const result = await handler(makeEvent())

    expect(mockDb.update).toHaveBeenCalledOnce()
    expect(mockSendWhatsAppMessage).toHaveBeenCalledOnce()
    expect(result).toContain('<Response/>')
  })

  it('updates status to rejected and notifies client on RECHAZAR', async () => {
    mockGetHeader.mockReturnValue('valid_sig')
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A%2B528112345678&Body=RECHAZAR+${FOLIO}`
    )
    mockDb.select
      .mockReturnValueOnce(dbChain([PENDING_RESERVATION]))
      .mockReturnValueOnce(dbChain([BRANCH_DETAILS]))
    mockDb.update.mockReturnValueOnce(
      dbChain([{ ...PENDING_RESERVATION, status: 'rejected' }])
    )

    const result = await handler(makeEvent())

    expect(mockDb.update).toHaveBeenCalledOnce()
    expect(mockSendWhatsAppMessage).toHaveBeenCalledOnce()
    expect(result).toContain('<Response/>')
  })

  it('sends help message and returns 200 on unrecognized keyword', async () => {
    mockGetHeader.mockReturnValue('valid_sig')
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A%2B528112345678&Body=HOLA`
    )

    const result = await handler(makeEvent())

    expect(mockDb.update).not.toHaveBeenCalled()
    expect(mockSendWhatsAppMessage).toHaveBeenCalledOnce()
    expect(result).toContain('<Response/>')
  })

  it('returns 200 without crashing on unknown folio', async () => {
    mockGetHeader.mockReturnValue('valid_sig')
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A%2B528112345678&Body=ACEPTAR+XXXXXXXX`
    )
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockDb.update).not.toHaveBeenCalled()
    expect(result).toContain('<Response/>')
  })

  it('ignores response for reservation already in terminal status', async () => {
    mockGetHeader.mockReturnValue('valid_sig')
    mockReadRawBody.mockResolvedValue(
      `From=whatsapp%3A%2B528112345678&Body=ACEPTAR+${FOLIO}`
    )
    mockDb.select.mockReturnValueOnce(dbChain([]))

    const result = await handler(makeEvent())

    expect(mockDb.update).not.toHaveBeenCalled()
    expect(result).toContain('<Response/>')
  })
})
