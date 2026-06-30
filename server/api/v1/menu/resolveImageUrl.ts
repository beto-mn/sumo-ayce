import { env } from '../../../utils/env'

/**
 * Resolves a Vercel Blob image URL from a Blob-relative file path.
 *
 * Returns null when filePath is null (items without an image).
 * Strips trailing slash from BLOB_BASE_URL and leading slash from filePath
 * to ensure the result never contains a double slash.
 */
export function resolveImageUrl(filePath: string | null): string | null {
  if (!filePath) return null
  const base = env.BLOB_BASE_URL.replace(/\/$/, '')
  const path = filePath.replace(/^\//, '')
  return `${base}/${path}`
}
