import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError } from '../../../../utils/error-handler'

const {
  mockRequireStaffAuth,
  mockDbSelect,
  mockSelectLimit,
  mockGetRouterParam,
} = vi.hoisted(() => ({
  mockRequireStaffAuth: vi.fn(),
  mockDbSelect: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockGetRouterParam: vi.fn().mockReturnValue('5512345678'),
}))

vi.mock('../../../../utils/staff-auth', () => ({
  requireStaffAuth: mockRequireStaffAuth,
}))
vi.mock('../../../../utils/db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../../../../db/schema', () => ({ customers: {} }))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    getRouterParam: mockGetRouterParam,
  }
})
vi.mock('../../../../utils/twilio', () => ({
  normalizePhone: (p: string) => `+52${p}`,
}))
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './[phone].get'

const mockCustomer = {
  id: 'cust-uuid',
  name: 'María García',
  phone: '+525512345678',
  pointsBalance: 45,
  whatsappOptIn: true,
  createdAt: new Date(),
}

beforeEach(() => {
  vi.clearAllMocks()
  mockRequireStaffAuth.mockResolvedValue({
    id: 'staff-uuid',
    role: 'staff',
    branchId: 'branch-uuid',
  })
  mockGetRouterParam.mockReturnValue('5512345678')
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({ limit: mockSelectLimit }),
    }),
  })
})

describe('GET /api/v1/staff/customers/[phone]', () => {
  it('returns customer when found', async () => {
    mockSelectLimit.mockResolvedValue([mockCustomer])
    const result = await (handler as (event: unknown) => Promise<unknown>)({})
    expect(result).toMatchObject({
      data: { name: 'María García', pointsBalance: 45 },
    })
  })

  it('throws 404 when customer not found', async () => {
    mockSelectLimit.mockResolvedValue([])
    await expect(
      (handler as (event: unknown) => Promise<unknown>)({})
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 404
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
