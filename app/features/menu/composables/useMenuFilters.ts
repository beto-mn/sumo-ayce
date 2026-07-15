import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import {
  getCuratedSet,
  getDefaultKey,
  type PrimarySelection,
  resolveActiveKey,
} from '@/features/menu/menu-sets'
import type { MenuModality } from '@/types/menu'

export interface MenuFilters {
  activeSelection: Ref<PrimarySelection>
  activeModality: Ref<MenuModality>
  activeCategory: Ref<string>
  showModalityToggle: ComputedRef<boolean>
  isDrinks: ComputedRef<boolean>
  isKids: ComputedRef<boolean>
  showCategoryChips: ComputedRef<boolean>
  curatedSet: ComputedRef<string[]>
  accentStyle: ComputedRef<{ '--accent': string }>
  setSelection: (selection: PrimarySelection) => void
  setModality: (modality: MenuModality) => void
  setCategory: (key: string) => void
}

/** Maps the URL `type` param to the internal primary selection (undefined if absent). */
function parseSelection(value: unknown): PrimarySelection | undefined {
  if (value === 'ayce') return 'ayce'
  if (value === 'express') return 'express'
  if (value === 'kids') return 'kids'
  if (value === 'bebidas' || value === 'drinks') return 'drinks'
  return undefined
}

/** Serialises the internal selection back to the URL `type` param. */
function selectionToParam(selection: PrimarySelection): string {
  return selection === 'drinks' ? 'bebidas' : selection
}

function parseModality(value: unknown): MenuModality | undefined {
  if (value === 'carta') return 'carta'
  if (value === 'buffet') return 'buffet'
  return undefined
}

export function useMenuFilters(
  initialSelection: PrimarySelection,
  initialModality: MenuModality
): MenuFilters {
  const router = useRouter()
  const route = useRoute()

  const activeSelection = ref<PrimarySelection>(
    parseSelection(route.query.type) ?? initialSelection
  )
  const activeModality = ref<MenuModality>(
    activeSelection.value === 'ayce'
      ? (parseModality(route.query.modality) ?? initialModality)
      : 'buffet'
  )
  // Default category is ALWAYS the first entry of the active set (no show-all);
  // an out-of-set deep-link key falls back to the view default (FR-013d).
  const activeCategory = ref<string>(
    resolveActiveKey(
      activeSelection.value,
      activeModality.value,
      route.query.category as string | undefined
    )
  )

  const showModalityToggle = computed(() => activeSelection.value === 'ayce')
  const isDrinks = computed(() => activeSelection.value === 'drinks')
  const isKids = computed(() => activeSelection.value === 'kids')
  // Kids is a single flat list, so it renders WITHOUT a category-chip row.
  const showCategoryChips = computed(() => activeSelection.value !== 'kids')
  const curatedSet = computed(() =>
    getCuratedSet(activeSelection.value, activeModality.value)
  )

  const accentStyle = computed(() => {
    if (activeSelection.value === 'express')
      return { '--accent': 'var(--blue)' }
    // Bebidas and Kids are both cross-cutting (available at either sucursal), so
    // they share the same soft/ink treatment; only AYCE/Express get a hue.
    if (activeSelection.value === 'drinks' || activeSelection.value === 'kids')
      return { '--accent': 'var(--soft)' }
    return { '--accent': 'var(--orange)' }
  })

  function syncUrl(): void {
    const { type: _t, modality: _m, category: _c, ...rest } = route.query
    const query: Record<string, string> = {
      ...rest,
      type: selectionToParam(activeSelection.value),
      category: activeCategory.value,
    }
    if (activeSelection.value === 'ayce') query.modality = activeModality.value
    router.replace({ query })
  }

  function setSelection(selection: PrimarySelection): void {
    activeSelection.value = selection
    activeModality.value = 'buffet'
    activeCategory.value = getDefaultKey(selection)
    syncUrl()
  }

  function setModality(modality: MenuModality): void {
    activeModality.value = modality
    activeCategory.value = getDefaultKey(activeSelection.value)
    syncUrl()
  }

  function setCategory(key: string): void {
    activeCategory.value = resolveActiveKey(
      activeSelection.value,
      activeModality.value,
      key
    )
    syncUrl()
  }

  return {
    activeSelection,
    activeModality,
    activeCategory,
    showModalityToggle,
    isDrinks,
    isKids,
    showCategoryChips,
    curatedSet,
    accentStyle,
    setSelection,
    setModality,
    setCategory,
  }
}
