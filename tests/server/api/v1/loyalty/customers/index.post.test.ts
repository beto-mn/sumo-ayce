import type { H3Event } from 'h3'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { dbChain, mockDb } from '../../../../../mocks/db'

vi.mock('../../../../../../server/utils/db', async () => {
  const { mockDb } = await import('../../../../../mocks/db')
  return { db: mockDb }
})

const { mockReadValidatedBody, mockSendWhatsAppMessage } = vi.hoisted(() => ({
  mockReadValidatedBody: vi.fn(),
  mockSendWhatsAppMessage: vi.fn(),
}))

vi.mock('h3', async () => {
  const actual = await import('h3')
  return {
    ...actual,
    readValidatedBody: mockReadValidatedBody,
    setResponseStatus: vi.fn(),
  }
})

vi.mock('../../../../../../server/utils/twilio', () => ({
  sendWhatsAppMessage: mockSendWhatsAppMessage,
  normalizePhone: (p: string) => `+521${p.replace(/\D/g, '').slice(-10)}`,
}))

vi.mock('../../../../../../server/utils/logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import handler from '../../../../../../server/api/v1/loyalty/customers/index.post'

const event = {} as unknown as H3Event

const NEW_CUSTOMER = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Ana García',
  phone: '+5215512345678',
  whatsappOptIn: true,
  pointsBalance: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
}

describe('POST /api/v1/loyalty/customers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSendWhatsAppMessage.mockResolvedValue(undefined)
  })

  it('creates new customer and returns 201 with pointsBalance=0', async () => {
    mockReadValidatedBody.mockResolvedValueOnce({
      name: 'Ana García',
      phone: '5512345678',
      whatsappOptIn: true,
    })
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([NEW_CUSTOMER]))

    const result = await handler(event)

    expect(result.data.pointsBalance).toBe(0)
    expect(result.error).toBeNull()
  })

  it('sends welcome WhatsApp when whatsappOptIn=true', async () => {
    mockReadValidatedBody.mockResolvedValueOnce({
      name: 'Ana García',
      phone: '5512345678',
      whatsappOptIn: true,
    })
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(dbChain([NEW_CUSTOMER]))

    await handler(event)

    await new Promise(r => setTimeout(r, 10))
    expect(mockSendWhatsAppMessage).toHaveBeenCalledOnce()
  })

  it('does not send WhatsApp when whatsappOptIn=false', async () => {
    mockReadValidatedBody.mockResolvedValueOnce({
      name: 'Ana García',
      phone: '5512345678',
      whatsappOptIn: false,
    })
    mockDb.select.mockReturnValueOnce(dbChain([]))
    mockDb.insert.mockReturnValueOnce(
      dbChain([{ ...NEW_CUSTOMER, whatsappOptIn: false }])
    )

    await handler(event)

    await new Promise(r => setTimeout(r, 10))
    expect(mockSendWhatsAppMessage).not.toHaveBeenCalled()
  })

  it('returns 409 with existing customer data on duplicate phone', async () => {
    mockReadValidatedBody.mockResolvedValueOnce({
      name: 'Ana García',
      phone: '5512345678',
      whatsappOptIn: true,
    })
    mockDb.select.mockReturnValueOnce(dbChain([NEW_CUSTOMER]))

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 409 })
  })

  it('returns 400 on missing name', async () => {
    const zodErr = z.object({ name: z.string() }).safeParse({})
    mockReadValidatedBody.mockRejectedValueOnce(zodErr.error)

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 })
  })
})
