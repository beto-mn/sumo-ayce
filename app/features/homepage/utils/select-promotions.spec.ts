import { describe, expect, it } from 'vitest'
import type { Promotion } from '@/types/content'
import { selectPromotions } from './select-promotions'

function makePromo(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: '1',
    badge: { es: '2x1', en: '2for1' },
    title: { es: 'Promo', en: 'Promo' },
    description: { es: 'desc', en: 'desc' },
    validity: { es: 'hoy', en: 'today' },
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-10T00:00:00Z',
    imageUrl: null,
    ...overrides,
  }
}

describe('selectPromotions', () => {
  it('keeps active promotions of any type and drops inactive ones', () => {
    const input = [
      makePromo({ id: 'a', type: 'all' }),
      makePromo({ id: 'b', type: 'ayce' }),
      makePromo({ id: 'c', type: 'express' }),
      makePromo({ id: 'd', active: false }),
    ]
    const out = selectPromotions(input)
    // express ('c') is now included; only the inactive one ('d') is dropped.
    expect(out.map(p => p.id)).toEqual(['a', 'b', 'c'])
  })

  it('includes an active express promotion', () => {
    const input = [
      makePromo({ id: 'exp', type: 'express', color: 'blue' }),
      makePromo({ id: 'off', type: 'express', active: false }),
    ]
    const out = selectPromotions(input)
    expect(out.map(p => p.id)).toEqual(['exp'])
  })

  it('sorts by publish date descending (most recent first)', () => {
    const input = [
      makePromo({ id: 'old', publishedAt: '2026-01-01T00:00:00Z' }),
      makePromo({ id: 'new', publishedAt: '2026-06-01T00:00:00Z' }),
      makePromo({ id: 'mid', publishedAt: '2026-03-01T00:00:00Z' }),
    ]
    const out = selectPromotions(input)
    expect(out.map(p => p.id)).toEqual(['new', 'mid', 'old'])
  })

  it('slices to a maximum of 3 promotions', () => {
    const input = Array.from({ length: 6 }, (_, i) =>
      makePromo({ id: String(i), publishedAt: `2026-06-0${i + 1}T00:00:00Z` })
    )
    expect(selectPromotions(input)).toHaveLength(3)
  })

  it('returns fewer than 3 without padding when fewer exist', () => {
    expect(selectPromotions([makePromo({ id: 'only' })])).toHaveLength(1)
  })

  it('returns an empty array for empty input', () => {
    expect(selectPromotions([])).toEqual([])
  })
})
