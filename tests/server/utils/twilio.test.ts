import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockMessagesCreate, resetTwilioMock } from '../../mocks/twilio'

vi.mock('../../mocks/twilio')

vi.mock('../../../server/utils/env', () => ({
  env: {
    TWILIO_ACCOUNT_SID: 'ACtest',
    TWILIO_AUTH_TOKEN: 'test_token',
    TWILIO_WHATSAPP_NUMBER: 'whatsapp:+14155238886',
  },
}))

vi.mock('../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

vi.mock('twilio', () => ({
  default: vi.fn(() => ({
    messages: { create: mockMessagesCreate },
  })),
  validateRequest: vi.fn(() => true),
}))

import { ExternalServiceError } from '../../../server/utils/error-handler'
import {
  normalizePhone,
  sendWhatsAppMessage,
} from '../../../server/utils/twilio'

describe('normalizePhone', () => {
  it('prepends +521 to 10-digit Mexican number', () => {
    expect(normalizePhone('8112345678')).toBe('+5218112345678')
  })

  it('converts 12-digit 52-prefixed number to +521 format', () => {
    expect(normalizePhone('528112345678')).toBe('+5218112345678')
  })

  it('preserves 13-digit number already in +521 format', () => {
    expect(normalizePhone('5218112345678')).toBe('+5218112345678')
  })

  it('strips spaces and converts +52 prefix to +521', () => {
    expect(normalizePhone('+52 81 1234 5678')).toBe('+5218112345678')
  })

  it('handles number already in +521 E.164 format', () => {
    expect(normalizePhone('+5218112345678')).toBe('+5218112345678')
  })
})

describe('sendWhatsAppMessage', () => {
  beforeEach(() => resetTwilioMock())

  it('calls messages.create with correct whatsapp prefix and body', async () => {
    mockMessagesCreate.mockResolvedValueOnce({ sid: 'SMtest' })
    await sendWhatsAppMessage('8112345678', 'Hola test')
    expect(mockMessagesCreate).toHaveBeenCalledWith({
      from: 'whatsapp:+14155238886',
      to: 'whatsapp:+5218112345678',
      body: 'Hola test',
    })
  })

  it('throws ExternalServiceError when Twilio fails', async () => {
    mockMessagesCreate.mockRejectedValueOnce(new Error('Twilio down'))
    await expect(
      sendWhatsAppMessage('8112345678', 'msg')
    ).rejects.toBeInstanceOf(ExternalServiceError)
  })
})
