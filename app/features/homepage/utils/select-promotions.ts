import type { Promotion } from '@/types/content'

/**
 * Pick the "top 3" homepage promotions: all active promos regardless of type
 * (`all`, `ayce` or `express`), ordered most-recent-first, capped at 3. Express
 * promos are included too — PromoCard color-codes them blue. Stays defensive
 * even if the upstream source already returns them ranked.
 */
export function selectPromotions(promotions: Promotion[]): Promotion[] {
  return promotions
    .filter(p => p.active)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    .slice(0, 3)
}
