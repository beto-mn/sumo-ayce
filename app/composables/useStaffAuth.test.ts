import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('reactive', (obj: object) => obj)
vi.stubGlobal('readonly', (ref: unknown) => ref)
vi.stubGlobal('toRef', (obj: Record<string, unknown>, key: string) => ({
  value: obj[key],
}))

describe('useStaffAuth', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('sets user on successful login', async () => {
    mockFetch.mockResolvedValue({
      data: { id: 'u1', name: 'Juan', role: 'staff' },
    })
    const { useStaffAuth } = await import('./useStaffAuth')
    const { login } = useStaffAuth()
    await login('juan@sumo.com', 'pass')
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/staff/auth/login',
      expect.objectContaining({ method: 'POST' })
    )
  })

  it('throws error string on failed login', async () => {
    mockFetch.mockRejectedValue(new Error('401'))
    const { useStaffAuth } = await import('./useStaffAuth')
    const { login } = useStaffAuth()
    await expect(login('x@sumo.com', 'wrong')).rejects.toBe(
      'Credenciales inválidas'
    )
  })

  it('clears user on logout', async () => {
    mockFetch.mockResolvedValue({})
    const { useStaffAuth } = await import('./useStaffAuth')
    const { logout } = useStaffAuth()
    await logout()
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/staff/auth/logout',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
