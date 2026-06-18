import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)
vi.stubGlobal('ref', (v: unknown) => ({ value: v }))
vi.stubGlobal('readonly', (r: unknown) => r)

describe('useStaffCustomer', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('findByPhone returns customer data', async () => {
    mockFetch.mockResolvedValue({
      data: { id: 'c1', name: 'María', phone: '+52551', pointsBalance: 5 },
    })
    const { useStaffCustomer } = await import('./useStaffCustomer')
    const { findByPhone } = useStaffCustomer()
    const result = await findByPhone('+52551')
    expect(result?.name).toBe('María')
  })

  it('findByPhone returns null on 404', async () => {
    mockFetch.mockRejectedValue({ statusCode: 404 })
    const { useStaffCustomer } = await import('./useStaffCustomer')
    const { findByPhone } = useStaffCustomer()
    const result = await findByPhone('+52000')
    expect(result).toBeNull()
  })

  it('registerVisit calls correct endpoint', async () => {
    mockFetch.mockResolvedValue({
      data: { transactionId: 'tx1', newBalance: 6 },
    })
    const { useStaffCustomer } = await import('./useStaffCustomer')
    const { registerVisit } = useStaffCustomer()
    const result = await registerVisit('+52551', 'TKT-001')
    expect(result.newBalance).toBe(6)
    expect(mockFetch).toHaveBeenCalledWith(
      '/api/v1/staff/transactions',
      expect.objectContaining({ method: 'POST' })
    )
  })
})
