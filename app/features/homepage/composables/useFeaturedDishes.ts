import type { ComputedRef } from 'vue'
import { computed } from 'vue'
import type { FeaturedDish } from '@/types/content'
import type { FeaturedDishRow } from '@/types/menu'

interface UseFeaturedDishesReturn {
  dishes: ComputedRef<FeaturedDish[]>
  ok: ComputedRef<boolean>
  pending: ComputedRef<boolean>
}

export function useFeaturedDishes(): UseFeaturedDishesReturn {
  const { locale } = useI18n()

  const { data, status } = useAsyncData<FeaturedDishRow[]>(
    'featured-dishes',
    () => $fetch<FeaturedDishRow[]>('/api/v1/menu/featured')
  )

  const dishes = computed<FeaturedDish[]>(() => {
    if (!data.value) return []
    const loc = locale.value as 'es' | 'en'
    return data.value.map(row => ({
      id: row.id,
      name: row.name[loc] ?? row.name.es,
      description: row.description,
      imageUrl: row.imageUrl,
      badge: row.badge ? (row.badge[loc] ?? row.badge.es) : null,
      category: row.category,
      locationType: row.locationType,
      includedInAyce: row.includedInAyce,
    }))
  })

  return {
    dishes,
    ok: computed(() => status.value !== 'error'),
    pending: computed(() => status.value === 'pending'),
  }
}
