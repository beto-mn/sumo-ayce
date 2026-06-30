import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildRadii } from '../../../server/utils/branch-finder-config'

const REQUIRED_ENV = {
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
  WORDPRESS_API_URL: 'https://cms.example.com',
  TWILIO_ACCOUNT_SID: 'ACtest',
  TWILIO_AUTH_TOKEN: 'authtoken',
  TWILIO_WHATSAPP_NUMBER: '+15005550006',
  GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@test.iam.gserviceaccount.com',
  GOOGLE_PRIVATE_KEY: 'key',
  GOOGLE_DRIVE_FOLDER_ID: 'folder123',
  NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.test',
  BLOB_BASE_URL: 'https://abc123.public.blob.vercel-storage.com',
}

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
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    process.env = {
      ...ORIGINAL_ENV,
      ...REQUIRED_ENV,
    }
    delete process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM
    delete process.env.BRANCH_FINDER_MAX_RADIUS_KM
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
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

  it('throws at startup when BRANCH_FINDER_DEFAULT_RADIUS_KM is 0 or negative', async () => {
    process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM = '0'
    const { branchFinderConfig } = await import(
      '../../../server/utils/branch-finder-config'
    )
    expect(() => branchFinderConfig.defaultRadiusKm).toThrow(
      /Missing or invalid environment variables/
    )
  })

  it('reads custom radius values from env', async () => {
    process.env.BRANCH_FINDER_DEFAULT_RADIUS_KM = '3'
    process.env.BRANCH_FINDER_MAX_RADIUS_KM = '15'
    const { branchFinderConfig } = await import(
      '../../../server/utils/branch-finder-config'
    )
    expect(branchFinderConfig.defaultRadiusKm).toBe(3)
    expect(branchFinderConfig.maxRadiusKm).toBe(15)
  })
})
