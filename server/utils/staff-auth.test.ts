import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthError, ForbiddenError } from './error-handler'

const { mockDbSelect, mockSelectLimit } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockSelectLimit: vi.fn(),
}))

vi.mock('./db', () => ({ db: { select: mockDbSelect } }))
vi.mock('../db/schema', () => ({
  staffSessions: {},
  staffUsers: {},
}))
vi.mock('h3', () => ({
  getCookie: (_event: unknown, name: string) => {
    const event = _event as { node: { req: { headers: { cookie: string } } } }
    const match = event.node.req.headers.cookie.match(
      new RegExp(`${name}=([^;]+)`)
    )
    return match?.[1]
  },
}))

import { requireStaffAuth } from './staff-auth'

beforeEach(() => {
  vi.clearAllMocks()
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      innerJoin: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: mockSelectLimit,
        }),
      }),
    }),
  })
})

const mockStaffRow = {
  id: 'staff-uuid',
  name: 'Juan Cajero',
  email: 'juan@sumo.com',
  role: 'staff' as const,
  branchId: 'branch-uuid',
  isActive: true,
}

const mockEvent = (token: string | undefined) => ({
  node: { req: { headers: { cookie: token ? `staff_session=${token}` : '' } } },
})

describe('requireStaffAuth', () => {
  it('throws AuthError when no cookie', async () => {
    await expect(
      requireStaffAuth(mockEvent(undefined) as never)
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('throws AuthError when session not found or expired', async () => {
    mockSelectLimit.mockResolvedValue([])
    await expect(
      requireStaffAuth(mockEvent('bad-token') as never)
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('throws AuthError when staff user is inactive', async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockStaffRow, isActive: false }])
    await expect(
      requireStaffAuth(mockEvent('valid-token') as never)
    ).rejects.toBeInstanceOf(AuthError)
  })

  it('returns staff user for valid session', async () => {
    mockSelectLimit.mockResolvedValue([mockStaffRow])
    const user = await requireStaffAuth(mockEvent('valid-token') as never)
    expect(user.id).toBe('staff-uuid')
    expect(user.role).toBe('staff')
  })

  it('throws ForbiddenError when role is insufficient', async () => {
    mockSelectLimit.mockResolvedValue([mockStaffRow])
    await expect(
      requireStaffAuth(mockEvent('valid-token') as never, 'admin')
    ).rejects.toBeInstanceOf(ForbiddenError)
  })

  it('passes when role meets minimum', async () => {
    mockSelectLimit.mockResolvedValue([{ ...mockStaffRow, role: 'admin' }])
    const user = await requireStaffAuth(
      mockEvent('valid-token') as never,
      'admin'
    )
    expect(user.role).toBe('admin')
  })
})
