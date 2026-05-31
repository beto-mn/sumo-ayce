import { scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockDbSelect, mockDbInsert, mockSetCookie, mockReadValidatedBody } =
  vi.hoisted(() => ({
    mockDbSelect: vi.fn(),
    mockDbInsert: vi.fn(),
    mockSetCookie: vi.fn(),
    mockReadValidatedBody: vi.fn(),
  }))

vi.mock('../../../../utils/db', () => ({
  db: { select: mockDbSelect, insert: mockDbInsert },
}))
vi.mock('../../../../db/schema', () => ({
  staffUsers: {},
  staffSessions: {},
  branches: {},
}))
vi.mock('h3', async importOriginal => {
  const actual = await importOriginal<typeof import('h3')>()
  return {
    ...actual,
    defineEventHandler: (fn: unknown) => fn,
    readValidatedBody: mockReadValidatedBody,
    setCookie: mockSetCookie,
  }
})
vi.mock('../../../../utils/response', () => ({
  ok: (data: unknown) => ({ data }),
}))

import handler from './login.post'

const scryptAsync = promisify(scrypt)
const mockSelectUsers = vi.fn()
const mockSelectBranch = vi.fn()
const mockInsert = vi.fn()

const mockUser = {
  id: 'user-uuid',
  name: 'Juan',
  email: 'juan@sumo.com',
  role: 'staff',
  branchId: 'branch-uuid',
  isActive: true,
  passwordHash: '',
}

beforeEach(async () => {
  vi.clearAllMocks()

  const salt = 'testsalt'
  const hash = (await scryptAsync('password123', salt, 64)) as Buffer
  mockUser.passwordHash = `${salt}:${hash.toString('hex')}`

  let selectCallCount = 0
  mockDbSelect.mockImplementation(() => {
    selectCallCount++
    const call = selectCallCount
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: call === 1 ? mockSelectUsers : mockSelectBranch,
        }),
      }),
    }
  })

  mockDbInsert.mockReturnValue({ values: mockInsert.mockResolvedValue([]) })
})

describe('POST /api/v1/staff/auth/login', () => {
  it('returns user data on valid credentials', async () => {
    mockSelectUsers.mockResolvedValue([mockUser])
    mockSelectBranch.mockResolvedValue([{ name: 'SUMO Satelite' }])
    mockReadValidatedBody.mockResolvedValue({
      email: 'juan@sumo.com',
      password: 'password123',
    })

    const result = await (handler as (event: unknown) => Promise<unknown>)({
      node: { req: { headers: {} } },
    })
    expect(result).toMatchObject({
      data: { role: 'staff', branchName: 'SUMO Satelite' },
    })
  })

  it('throws AuthError for wrong password', async () => {
    mockSelectUsers.mockResolvedValue([mockUser])
    mockReadValidatedBody.mockResolvedValue({
      email: 'juan@sumo.com',
      password: 'wrong',
    })

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({
        node: { req: { headers: {} } },
      })
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 401
    )
  })

  it('throws AuthError when user not found', async () => {
    mockSelectUsers.mockResolvedValue([])
    mockReadValidatedBody.mockResolvedValue({
      email: 'nobody@sumo.com',
      password: 'password123',
    })

    await expect(
      (handler as (event: unknown) => Promise<unknown>)({
        node: { req: { headers: {} } },
      })
    ).rejects.toSatisfy(
      (e: unknown) => (e as { statusCode?: number }).statusCode === 401
    )
  })
})
