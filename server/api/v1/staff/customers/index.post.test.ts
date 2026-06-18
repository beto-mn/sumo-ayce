import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError } from '../../../../utils/error-handler'

const {
  mockRequireStaffAuth,
  mockDbSelect,
  mockDbInsert,
  mockSelectLimit,
  mockInsertReturning,
  mockReadValidatedBody,
} = vi.hoisted(() => ({
  mockRequireStaffAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockInsertReturning: vi.fn(),
  mockReadValidatedBody: vi.fn(),
}))

vi.mock('../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../utils/db', () => ({
  db: { select: mockDbSelect, insert: mockDbInsert },
}))
vi.mock('../../../../db/schema', () => ({ customers: {} }))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    readValidatedBody: mockReadValidatedBody,
    setResponseStatus: vi.fn(),
  }
})
vi.mock('../../../../utils/twilio', () => ({
  normalizePhone: (p: string) => p,
  sendWhatsAppMessage: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../../../../utils/logger', () => ({ logger: { error: vi.fn() } }))
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './index.post'

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({ id: 'staff-uuid' })
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: mockSelectLimit }),
    }),
  })
  mockDbInsert.mockReturnValue({
    values: vi.fn().mockReturnValue({ returning: mockInsertReturning }),
  })
})

describe('POST /api/v1/staff/customers', () => {
  it('creates a new customer', async () => {
    mockSelectLimit.mockResolvedValue([])
    mockInsertReturning.mockResolvedValue([
      {
        id: 'c1',
        name: 'María',
        phone: '+52551',
        pointsBalance: 0,
        whatsappOptIn: true,
      },
    ])
    mockReadValidatedBody.mockResolvedValue({
      name: 'María',
      phone: '+52551',
      whatsappOptIn: true,
    })

    const result = (await (handler as (event: unknown) => Promise<unknown>)(
      {}
    )) as { data: { name: string } }
    expect(result.data.name).toBe('María')
  })

  it('throws 409 when phone already registered', async () => {
    mockSelectLimit.mockResolvedValue([
      { id: 'existing', name: 'Existing', phone: '+52551', pointsBalance: 5 },
    ])
    mockReadValidatedBody.mockResolvedValue({
      name: 'Dup',
      phone: '+52551',
      whatsappOptIn: false,
    })

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 409
    )
  })

  it('throws 401 when no session', async () => {
    mockRequireStaffAuth.mockRejectedValue(new AuthError())

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 401
    )
  })
})
