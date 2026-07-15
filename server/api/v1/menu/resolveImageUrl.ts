import { env } from '../../../utils/env'

/**
 * Cache-busting version for Blob-hosted menu/featured images.
 *
 * Vercel Blob objects are overwritten IN PLACE (same path) and served with
 * `cache-control: max-age=2592000` (30 days), so returning visitors would keep
 * the stale image. Appending `?v=<MENU_IMAGE_VERSION>` makes an updated image a
 * NEW resource URL, busting both the browser and the CDN cache.
 *
 * ⚠️ BUMP THIS VALUE whenever menu images are replaced in Blob (e.g. increment
 * the trailing counter or set a new date), otherwise clients keep the old image.
 * It is intentionally a hand-maintained constant — NOT derived from build time —
 * so ordinary deploys do NOT needlessly bust every image and re-download them.
 */
export const MENU_IMAGE_VERSION = '2026-07-14-1'

/**
 * Resolves a Vercel Blob image URL from a Blob-relative file path.
 *
 * Returns null when filePath is null (items without an image).
 * Strips trailing slash from BLOB_BASE_URL and leading slash from filePath
 * to ensure the result never contains a double slash. Appends
 * `?v=<MENU_IMAGE_VERSION>` for cache-busting (see above).
 */
export function resolveImageUrl(filePath: string | null): string | null {
  if (!filePath) return null
  const base = env.BLOB_BASE_URL.replace(/\/$/, '')
  const path = filePath.replace(/^\//, '')
  return `${base}/${path}?v=${MENU_IMAGE_VERSION}`
}
