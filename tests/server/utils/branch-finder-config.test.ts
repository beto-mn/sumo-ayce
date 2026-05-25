import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { buildRadii } from '../../../server/utils/branch-finder-config'

describe('buildRadii', () => {
  it('buildRadii(5, 20) returns [5, 8, 13, 20]', () => {
    expect(buildRadii(5, 20)).toEqual([5, 8, 13, 20])
  })

  it('buildRadii(10, 50) returns [10, 17, 29, 50]', () => {
    expect(buildRadii(10, 50)).toEqual([10, 17, 29, 50])
  })

  it('buildRadii(10, 100) returns [10, 22, 46, 100]', () => {
    expect(buildRadii(10, 100)).toEqual([10, 22, 46, 100])
  })

  it('buildRadii(7, 128) returns [7, 18, 49, 128]', () => {
    expect(buildRadii(7, 128)).toEqual([7, 18, 49, 128])
  })

  it('first element equals min and last equals max', () => {
    const radii = buildRadii(15, 80)
    expect(radii[0]).toBe(15)
    expect(radii[3]).toBe(80)
  })

  it('radii are strictly increasing', () => {
    const radii = buildRadii(10, 50)
    for (let i = 1; i < radii.length; i++) {
      expect(radii[i]).toBeGreaterThan(radii[i - 1])
    }
  })
})

describe('branchFinderConfig', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    delete process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM
    delete process.env.BRANCH_FINDER_MAX_RADIUS_KM
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('uses default 5 km when env var is absent', async () => {
    const { branchFinderConfig } = await import(
      '../../../server/utils/branch-finder-config'
    )
    expect(branchFinderConfig.defaultRadiusKm).toBe(5)
  })

  it('uses default 20 km max when env var is absent', async () => {
    const { branchFinderConfig } = await import(
      '../../../server/utils/branch-finder-config'
    )
    expect(branchFinderConfig.maxRadiusKm).toBe(20)
  })

  it('falls back to 5 when env var is 0 or negative', async () => {
    process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM = '0'
    const { branchFinderConfig } = await import(
      '../../../server/utils/branch-finder-config'
    )
    expect(branchFinderConfig.defaultRadiusKm).toBe(5)
  })
})
