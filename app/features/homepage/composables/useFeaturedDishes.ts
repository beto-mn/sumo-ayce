import { computed, type Ref, ref } from 'vue'
import { FEATURED_DISHES } from '@/features/homepage/data/featured-dishes'
import type { FeaturedDish } from '@/types/content'

interface UseFeaturedDishesReturn {
  dishes: Ref<FeaturedDish[]>
  ok: Ref<boolean>
  pending: Ref<boolean>
}

/**
 * Featured dishes for the homepage rail.
 *
 * TODO: dishes are read from a static fixture for now; swap for a real data
 * source (e.g. a Nitro route) later. The return contract (`dishes` + `ok` +
 * `pending`) is already correct, so the page and rail component need no change.
 */
export function useFeaturedDishes(): UseFeaturedDishesReturn {
  return {
    dishes: computed(() => FEATURED_DISHES),
    ok: ref(true),
    pending: ref(false),
  }
}
