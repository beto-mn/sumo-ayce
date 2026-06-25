import { describe, expect, it, vi } from 'vitest'
import type { FeaturedDishRow } from '@/types/menu'

const mockRows: FeaturedDishRow[] = [
  {
    id: 'dish-1',
    name: { es: 'Edamame', en: 'Edamame EN' },
    description: { es: 'Vainas de soya', en: 'Soybean pods' },
    imageUrl: '/menu/ayce/edamame.webp',
    badge: null,
    category: 'appetizers',
  },
]

vi.stubGlobal('useI18n', () => ({ locale: { value: 'es' } }))
vi.stubGlobal('useAsyncData', (_key: string, _fn: () => Promise<unknown>) => ({
  data: { value: mockRows },
  status: { value: 'success' },
}))
vi.stubGlobal('$fetch', vi.fn())

import { useFeaturedDishes } from './useFeaturedDishes'

describe('useFeaturedDishes', () => {
  it('exposes the featured dishes', () => {
    const { dishes } = useFeaturedDishes()
    expect(dishes.value.length).toBeGreaterThan(0)
    expect(dishes.value[0]).toHaveProperty('name')
    expect(dishes.value[0]).toHaveProperty('imageUrl')
  })

  it('reports ok=true and not pending on success', () => {
    const { ok, pending } = useFeaturedDishes()
    expect(ok.value).toBe(true)
    expect(pending.value).toBe(false)
  })

  it('returns FeaturedDish-shaped entries (id, description, category)', () => {
    const { dishes } = useFeaturedDishes()
    for (const dish of dishes.value) {
      expect(dish).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        category: expect.any(String),
      })
      expect(dish.description).toHaveProperty('es')
    }
  })

  it('picks the active locale for name', () => {
    const { dishes } = useFeaturedDishes()
    expect(dishes.value[0]?.name).toBe('Edamame')
  })
})
