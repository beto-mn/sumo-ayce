import { computed, type Ref } from 'vue'
import type { Promotion, PromotionsResult } from '@/types/content'

interface UsePromotionsReturn {
  promotions: Ref<Promotion[]>
  ok: Ref<boolean>
  pending: Ref<boolean>
}

/**
 * Server-side (ISR-cached) fetch of the WordPress-backed promotions content
 * route. Touches the promotions route only — never the featured-dishes
 * composable or any DB client (Gate V.3). Exposes an empty array on
 * failure/absence so the section self-hides; never throws to the component.
 */
export function usePromotions(): UsePromotionsReturn {
  const { data, pending } = useFetch<PromotionsResult>(
    '/api/v1/content/promotions',
    { default: () => ({ promotions: [], ok: false }) }
  )
  return {
    promotions: computed(() => data.value?.promotions ?? []),
    ok: computed(() => data.value?.ok ?? false),
    pending,
  }
}
