import { vi } from 'vitest'

export const mockMessagesCreate = vi.fn()

export const mockTwilioClient = {
  messages: {
    create: mockMessagesCreate,
  },
}

vi.mock('twilio', () => ({
  default: vi.fn(() => mockTwilioClient),
  Twilio: vi.fn(() => mockTwilioClient),
}))

export function resetTwilioMock() {
  mockMessagesCreate.mockReset()
}
