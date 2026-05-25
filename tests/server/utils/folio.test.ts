import { describe, expect, it } from 'vitest'
import { generateFolio } from '../../../server/utils/folio'

describe('generateFolio', () => {
  const uuid = '3fa85f64-5717-4562-b3fc-2c963f66afa6'

  it('returns exactly 8 characters', () => {
    expect(generateFolio(uuid)).toHaveLength(8)
  })

  it('returns uppercase string', () => {
    const folio = generateFolio(uuid)
    expect(folio).toBe(folio.toUpperCase())
  })

  it('contains no dashes', () => {
    expect(generateFolio(uuid)).not.toContain('-')
  })

  it('is deterministic for the same input', () => {
    expect(generateFolio(uuid)).toBe(generateFolio(uuid))
  })

  it('derives from first 8 chars of UUID without dashes', () => {
    expect(generateFolio(uuid)).toBe('3FA85F64')
  })
})
