import type { Promotion } from '@/types/content'

/**
 * Select the homepage promotions for the full-bleed carousel: ALL active promos
 * regardless of type (`all`, `ayce` or `express`), ordered most-recent-first —
 * NO cap. Each promo fills one full-width carousel slide, so the homepage shows
 * the same multi-slide carousel as the promotions page. Express promos are
 * included too. Stays defensive even if the upstream source already filtered/
 * ranked them.
 */
export function selectPromotions(promotions: Promotion[]): Promotion[] {
  return promotions
    .filter(p => p.active)
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
}
