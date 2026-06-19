import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const mockUseFetch = vi.fn()
vi.stubGlobal('useFetch', mockUseFetch)

describe('usePromotions', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('fetches the promotions content route', async () => {
    mockUseFetch.mockReturnValue({ data: ref(null), pending: ref(false) })
    const { usePromotions } = await import('./usePromotions')
    usePromotions()
    expect(mockUseFetch).toHaveBeenCalledWith(
      '/api/v1/content/promotions',
      expect.any(Object)
    )
  })

  it('exposes the route promotions when ok', async () => {
    mockUseFetch.mockReturnValue({
      data: ref({ promotions: [{ id: '1' }, { id: '2' }], ok: true }),
      pending: ref(false),
    })
    const { usePromotions } = await import('./usePromotions')
    const { promotions, ok } = usePromotions()
    expect(ok.value).toBe(true)
    expect(promotions.value).toHaveLength(2)
  })

  it('exposes an empty array when the route reports ok=false', async () => {
    mockUseFetch.mockReturnValue({
      data: ref({ promotions: [], ok: false }),
      pending: ref(false),
    })
    const { usePromotions } = await import('./usePromotions')
    const { promotions, ok } = usePromotions()
    expect(ok.value).toBe(false)
    expect(promotions.value).toEqual([])
  })

  it('exposes an empty array when data is null (no response yet)', async () => {
    mockUseFetch.mockReturnValue({ data: ref(null), pending: ref(true) })
    const { usePromotions } = await import('./usePromotions')
    const { promotions, pending } = usePromotions()
    expect(promotions.value).toEqual([])
    expect(pending.value).toBe(true)
  })
})
