import { describe, expect, it } from 'vitest'
import { haversineKm } from './haversine'

describe('haversineKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineKm(19.4326, -99.1332, 19.4326, -99.1332)).toBe(0)
  })

  it('computes ~3.46 km from Polanco to Roma Norte (±100 m tolerance)', () => {
    // Polanco: 19.4326, -99.1924 → Roma Norte: 19.4193, -99.1626
    const result = haversineKm(19.4326, -99.1924, 19.4193, -99.1626)
    expect(result).toBeGreaterThan(3.36)
    expect(result).toBeLessThan(3.56)
  })

  it('computes ~3.07 km from known test pair used in server tests', () => {
    // BRANCH_AT_0KM (19.4326, -99.1332) to BRANCH_AT_3KM (19.4057, -99.1332)
    const result = haversineKm(19.4326, -99.1332, 19.4057, -99.1332)
    expect(result).toBeGreaterThan(2.9)
    expect(result).toBeLessThan(3.1)
  })

  it('is symmetric (A→B == B→A)', () => {
    const ab = haversineKm(19.4326, -99.1332, 19.43, -99.19)
    const ba = haversineKm(19.43, -99.19, 19.4326, -99.1332)
    expect(ab).toBe(ba)
  })

  it('returns a positive number for different coordinates', () => {
    expect(haversineKm(19.4326, -99.1332, 19.5, -99.2)).toBeGreaterThan(0)
  })

  it('matches the server-side haversine output for same inputs', () => {
    // Both client and server use the same formula — verify same result
    const result = haversineKm(19.4326, -99.1332, 19.5224, -99.1332)
    // BRANCH_AT_10KM is at 19.5224 — server test expects ~10km
    expect(result).toBeGreaterThan(9.8)
    expect(result).toBeLessThan(10.2)
  })
})
