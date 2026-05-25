import { describe, expect, it } from 'vitest'
import { haversineKm } from '../../../server/utils/haversine'

describe('haversineKm', () => {
  it('returns 0 for the same point', () => {
    expect(haversineKm(19.4326, -99.1332, 19.4326, -99.1332)).toBe(0)
  })

  it('is symmetric — A→B equals B→A', () => {
    const ab = haversineKm(19.4326, -99.1332, 20.6597, -103.3496)
    const ba = haversineKm(20.6597, -103.3496, 19.4326, -99.1332)
    expect(ab).toBe(ba)
  })

  it('CDMX to Guadalajara is approximately 465 km', () => {
    // Zócalo CDMX → Centro Guadalajara
    const km = haversineKm(19.4326, -99.1332, 20.6597, -103.3496)
    expect(km).toBeGreaterThan(455)
    expect(km).toBeLessThan(475)
  })

  it('short distance within CDMX matches expected range', () => {
    // Zócalo (19.4326, -99.1332) → ~0.5° south (19.3826, -99.1332) ≈ 5.56 km
    const km = haversineKm(19.4326, -99.1332, 19.3826, -99.1332)
    expect(km).toBeGreaterThan(5.4)
    expect(km).toBeLessThan(5.7)
  })

  it('returns value rounded to 2 decimal places', () => {
    const km = haversineKm(19.4326, -99.1332, 20.6597, -103.3496)
    expect(km).toBe(Math.round(km * 100) / 100)
  })
})
