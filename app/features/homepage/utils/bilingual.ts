import type { Bilingual } from '@/types/content'

/**
 * Render a `Bilingual` field in the active locale, falling back to the Spanish
 * string when the active-locale value is empty/missing (FR-015, data-model §3).
 */
export function pickLocale(value: Bilingual, locale: string): string {
  if (locale === 'en') return value.en?.trim() ? value.en : value.es
  return value.es
}
