import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import type { MenuType } from '@/features/menu/types'
import type { MenuModality } from '@/types/menu'

export interface MenuFilters {
  activeType: Ref<MenuType>
  activeModality: Ref<MenuModality>
  activeCategory: Ref<string | null>
  showModalityToggle: ComputedRef<boolean>
  accentStyle: ComputedRef<{ '--accent': string }>
  setType: (type: MenuType) => void
  setModality: (modality: MenuModality) => void
  setCategory: (key: string | null) => void
}

export function useMenuFilters(
  initialType: MenuType,
  initialModality: MenuModality
): MenuFilters {
  const router = useRouter()
  const route = useRoute()

  const activeType = ref<MenuType>(initialType)
  const activeModality = ref<MenuModality>(initialModality)
  const activeCategory = ref<string | null>(
    (route.query.category as string) ?? null
  )

  const showModalityToggle = computed(() => activeType.value === 'ayce')

  const accentStyle = computed(() => ({
    '--accent': activeType.value === 'ayce' ? 'var(--orange)' : 'var(--blue)',
  }))

  function setType(type: MenuType): void {
    activeType.value = type
    activeModality.value = 'buffet'
    activeCategory.value = null
    const { category: _c, ...rest } = route.query
    router.replace({ query: { ...rest, type, modality: 'buffet' } })
  }

  function setModality(modality: MenuModality): void {
    activeModality.value = modality
    activeCategory.value = null
    const { category: _c, ...rest } = route.query
    router.replace({ query: { ...rest, modality } })
  }

  function setCategory(key: string | null): void {
    activeCategory.value = key
    const { category: _c, ...rest } = route.query
    router.replace({ query: key ? { ...rest, category: key } : rest })
  }

  return {
    activeType,
    activeModality,
    activeCategory,
    showModalityToggle,
    accentStyle,
    setType,
    setModality,
    setCategory,
  }
}
