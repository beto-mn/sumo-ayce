import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * Unit tests for resolveImageUrl() — 100% branch coverage (SC-004).
 *
 * resolveImageUrl is not directly exported from the production module.
 * We test observable behaviour by importing the env-aware helper exposed
 * for testing purposes, which performs the same string-assembly logic.
 *
 * All branches:
 *   1. filePath non-null → full URL (BLOB_BASE_URL + '/' + filePath)
 *   2. filePath null     → null
 *   3. BLOB_BASE_URL has trailing slash → result has no double slash
 *   4. filePath has leading slash       → result has no double slash
 */
describe('resolveImageUrl', () => {
  const ORIGINAL_ENV = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV }
  })

  function buildEnv(blobBaseUrl: string) {
    return {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/test',
      WORDPRESS_API_URL: 'https://cms.example.com',
      TWILIO_ACCOUNT_SID: 'ACtest',
      TWILIO_AUTH_TOKEN: 'authtoken',
      TWILIO_WHATSAPP_NUMBER: '+15005550006',
      GOOGLE_SERVICE_ACCOUNT_EMAIL: 'svc@test.iam.gserviceaccount.com',
      GOOGLE_PRIVATE_KEY:
        '-----BEGIN PRIVATE KEY-----\ntest\n-----END PRIVATE KEY-----\n',
      GOOGLE_DRIVE_FOLDER_ID: 'folder123',
      NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN: 'pk.test',
      BLOB_BASE_URL: blobBaseUrl,
    }
  }

  it('returns full URL with the cache-busting version param when filePath is non-null', async () => {
    process.env = {
      ...process.env,
      ...buildEnv('https://abc123.public.blob.vercel-storage.com'),
    }
    const { resolveImageUrl, MENU_IMAGE_VERSION } = await import(
      '../../../../../server/api/v1/menu/resolveImageUrl'
    )
    const result = resolveImageUrl('menu/ayce/mixed_yakimeshi.webp')
    expect(result).toBe(
      `https://abc123.public.blob.vercel-storage.com/menu/ayce/mixed_yakimeshi.webp?v=${MENU_IMAGE_VERSION}`
    )
    // The version suffix busts the 30-day Blob cache when an image is replaced.
    expect(result).toContain(`?v=${MENU_IMAGE_VERSION}`)
  })

  it('returns null when filePath is null', async () => {
    process.env = {
      ...process.env,
      ...buildEnv('https://abc123.public.blob.vercel-storage.com'),
    }
    const { resolveImageUrl } = await import(
      '../../../../../server/api/v1/menu/resolveImageUrl'
    )
    expect(resolveImageUrl(null)).toBeNull()
  })

  it('strips trailing slash from BLOB_BASE_URL to avoid double slash', async () => {
    process.env = {
      ...process.env,
      ...buildEnv('https://abc123.public.blob.vercel-storage.com/'),
    }
    const { resolveImageUrl, MENU_IMAGE_VERSION } = await import(
      '../../../../../server/api/v1/menu/resolveImageUrl'
    )
    const result = resolveImageUrl('menu/ayce/ramen.webp')
    expect(result).toBe(
      `https://abc123.public.blob.vercel-storage.com/menu/ayce/ramen.webp?v=${MENU_IMAGE_VERSION}`
    )
    // Verify the path portion (after https://, before the query) has no double slash
    const pathPart = result?.replace('https://', '').split('?')[0]
    expect(pathPart).not.toContain('//')
  })

  it('handles filePath with leading slash without producing double slash', async () => {
    process.env = {
      ...process.env,
      ...buildEnv('https://abc123.public.blob.vercel-storage.com'),
    }
    const { resolveImageUrl, MENU_IMAGE_VERSION } = await import(
      '../../../../../server/api/v1/menu/resolveImageUrl'
    )
    const result = resolveImageUrl('/menu/sauces/bbq.webp')
    // Leading slash in path is stripped so no double slash appears in the path portion
    expect(result).toBe(
      `https://abc123.public.blob.vercel-storage.com/menu/sauces/bbq.webp?v=${MENU_IMAGE_VERSION}`
    )
    const pathPart = result?.replace('https://', '').split('?')[0]
    expect(pathPart).not.toContain('//')
  })
})
