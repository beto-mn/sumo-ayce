import { describe, expect, it, vi } from 'vitest'
import { makeRawPromotion } from '../../../../tests/mocks/wordpress'
import { parsePromotions } from './validators'

// Silence the drop-warning logger during the negative-path tests.
vi.mock('../../../utils/logger', () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

describe('parsePromotions (NEW WordPress model)', () => {
  it('accepts the new acf shape (no titulo_es required) and retains the promo', () => {
    const parsed = parsePromotions([makeRawPromotion({ id: 1 })])
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.id).toBe('1')
  })

  it('retains a promo that has NO titulo_es (the old drop-all regression is fixed)', () => {
    // The old validator required acf.titulo_es (min 1) → dropped everything.
    const raw = makeRawPromotion({ id: 2 })
    // Ensure the removed field is genuinely absent.
    expect((raw.acf as Record<string, unknown>).titulo_es).toBeUndefined()
    const parsed = parsePromotions([raw])
    expect(parsed).toHaveLength(1)
  })

  it('derives the title from title.rendered and HTML-entity-decodes it', () => {
    const raw = makeRawPromotion({
      id: 3,
      title: { rendered: '2&#215;1 en sushi' },
    })
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.title).toBe('2×1 en sushi')
  })

  it('trims whitespace and leaves an empty title empty', () => {
    const raw = makeRawPromotion({ id: 4, title: { rendered: '   ' } })
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.title).toBe('')
  })

  it('maps the three responsive image media IDs', () => {
    const raw = makeRawPromotion(
      { id: 5 },
      { imagen_desktop: 100, imagen_tablet: 200, imagen_movil: 300 }
    )
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.desktopMediaId).toBe(100)
    expect(parsed[0]?.tabletMediaId).toBe(200)
    expect(parsed[0]?.movilMediaId).toBe(300)
  })

  it('coerces string media IDs and treats 0 as null', () => {
    const raw = makeRawPromotion(
      { id: 6 },
      { imagen_desktop: '42', imagen_tablet: 0, imagen_movil: 0 }
    )
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.desktopMediaId).toBe(42)
    expect(parsed[0]?.tabletMediaId).toBeNull()
    expect(parsed[0]?.movilMediaId).toBeNull()
  })

  it('PARSES a promo whose image fields are null (does not throw/drop)', () => {
    const raw = makeRawPromotion(
      { id: 20 },
      { imagen_desktop: null, imagen_tablet: null, imagen_movil: null }
    )
    const parsed = parsePromotions([raw])
    expect(parsed).toHaveLength(1)
    expect(parsed[0]?.desktopMediaId).toBeNull()
    expect(parsed[0]?.tabletMediaId).toBeNull()
    expect(parsed[0]?.movilMediaId).toBeNull()
  })

  it('maps badge bilingual with badge_en fallback to badge_es', () => {
    const raw = makeRawPromotion({ id: 7 }, { badge_en: undefined })
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.badge).toEqual({ es: '2x1', en: '2x1' })
  })

  it('normalizes an unknown color to orange', () => {
    const raw = makeRawPromotion({ id: 8 }, { color: 'purple' })
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.color).toBe('orange')
  })

  it('keeps color, tipo, active, publishedAt', () => {
    const raw = makeRawPromotion(
      { id: 9, date: '2026-06-20T00:00:00Z' },
      { color: 'pink', tipo: 'express', activa: true }
    )
    const parsed = parsePromotions([raw])
    expect(parsed[0]?.color).toBe('pink')
    expect(parsed[0]?.type).toBe('express')
    expect(parsed[0]?.active).toBe(true)
    expect(parsed[0]?.publishedAt).toBe('2026-06-20T00:00:00Z')
  })

  it('coerces the activa flag from common WP representations', () => {
    expect(
      parsePromotions([makeRawPromotion({ id: 10 }, { activa: '1' })])[0]
        ?.active
    ).toBe(true)
    expect(
      parsePromotions([makeRawPromotion({ id: 11 }, { activa: 0 })])[0]?.active
    ).toBe(false)
  })

  it('drops individually malformed items but keeps the valid ones', () => {
    const parsed = parsePromotions([
      makeRawPromotion({ id: 12 }),
      { id: 13, acf: { tipo: 'rainbow' } }, // invalid
      makeRawPromotion({ id: 14 }),
    ])
    expect(parsed.map(p => p.id)).toEqual(['12', '14'])
  })

  it('returns [] for a non-array payload', () => {
    expect(parsePromotions({ error: 'nope' })).toEqual([])
  })

  it('does NOT carry the removed description/validity fields', () => {
    const parsed = parsePromotions([makeRawPromotion({ id: 15 })])
    expect(parsed[0]).not.toHaveProperty('description')
    expect(parsed[0]).not.toHaveProperty('validity')
  })
})
