import { describe, expect, it } from 'vitest'
import { useFeaturedDishes } from './useFeaturedDishes'

describe('useFeaturedDishes', () => {
  it('exposes the featured dishes', () => {
    const { dishes } = useFeaturedDishes()
    expect(dishes.value.length).toBeGreaterThan(0)
    expect(dishes.value[0]).toHaveProperty('name')
    expect(dishes.value[0]).toHaveProperty('imageUrl')
  })

  it('reports ok=true and not pending for the static source', () => {
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
})
