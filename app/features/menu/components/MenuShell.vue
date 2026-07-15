<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { CategoryChip } from '@/features/menu/components/MenuCategoryChips.vue'
import { useMenuFilters } from '@/features/menu/composables/useMenuFilters'
import type { PrimarySelection } from '@/features/menu/menu-sets'
import type { FullMenuCategory, FullMenuResult } from '@/types/menu'

const props = defineProps<{
  menuData: FullMenuResult
  initialSelection: PrimarySelection
  initialModality: 'buffet' | 'carta'
}>()

const { t, locale } = useI18n()

const {
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
} = useMenuFilters(props.initialSelection, props.initialModality)

/** DB category name for a key (single source of truth for FOOD chip labels). */
function foodCategoryLabel(key: string): string {
  const category = props.menuData.categories.find(c => c.key === key)
  if (!category) return key
  return category.name[locale.value as 'es' | 'en'] || category.name.es || key
}

/** DB drink-group name for a key (single source of truth for DRINK chip labels). */
function drinkGroupLabel(key: string): string {
  const group = props.menuData.drinkGroups.find(g => g.key === key)
  if (!group) return key
  return group.name[locale.value as 'es' | 'en'] || group.name.es || key
}

/**
 * The ordered chips with their display labels. Both FOOD and DRINK labels come
 * from the DB (`menuData.categories[].name` / `menuData.drinkGroups[].name`, by
 * active locale) — the DB is the single source of truth; nothing reads i18n.
 */
const chipItems = computed<CategoryChip[]>(() =>
  curatedSet.value.map(key => ({
    key,
    label: isDrinks.value ? drinkGroupLabel(key) : foodCategoryLabel(key),
  }))
)

const drinkItems = computed(() => {
  const drinkCat = props.menuData.categories.find(c => c.key === 'drinks')
  return drinkCat?.dishes ?? []
})

/** The single active food category (empty-state safe: always a section). */
const activeFoodCategory = computed((): FullMenuCategory => {
  const found = props.menuData.categories.find(
    c => c.key === activeCategory.value
  )
  return (
    found ?? {
      key: activeCategory.value as FullMenuCategory['key'],
      name: { es: '', en: '' },
      note: null,
      displayOrder: 0,
      dishes: [],
    }
  )
})

/**
 * Kids items carry a fixed price ($149 combos, $179 AYCE Niños), so the Kids
 * view always renders in price ("carta") mode regardless of the AYCE modality.
 */
const gridModality = computed<'buffet' | 'carta'>(() =>
  isKids.value ? 'carta' : activeModality.value
)

/**
 * The Kids view splits its single `kids` category into TWO ordered sub-sections
 * by `includedInAyce`:
 *   1) "All You Can Eat Kids" — the $179 buffet item (includedInAyce = true).
 *   2) "Combo Infantil" — the 6 $149 combos (includedInAyce = false), carrying the
 *      DB category note (inclusion text) at the top of the section.
 * Headings are i18n (fixed nav copy); the note is DB-driven.
 */
const kidsSections = computed<FullMenuCategory[]>(() => {
  const kidsCategory = props.menuData.categories.find(c => c.key === 'kids')
  const dishes = kidsCategory?.dishes ?? []
  return [
    {
      key: 'kids',
      name: {
        es: t('menu.kids.ayce_heading'),
        en: t('menu.kids.ayce_heading'),
      },
      note: null,
      displayOrder: 0,
      dishes: dishes.filter(dish => dish.includedInAyce),
    },
    {
      key: 'kids',
      name: {
        es: t('menu.kids.combo_heading'),
        en: t('menu.kids.combo_heading'),
      },
      note: kidsCategory?.note ?? null,
      displayOrder: 1,
      dishes: dishes.filter(dish => !dish.includedInAyce),
    },
  ]
})

const showScrollTop = ref(false)
function onScroll(): void {
  showScrollTop.value = window.scrollY > 300
}
function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div :style="accentStyle">
    <div class="container-pop pt-8">
      <div class="mb-8">
        <MenuTypeToggle
          :active-selection="activeSelection"
          @update:selection="setSelection"
        >
          <template #modality>
            <MenuModalityToggle
              v-if="showModalityToggle"
              :active-modality="activeModality"
              @update:active-modality="setModality"
            />
          </template>
        </MenuTypeToggle>
      </div>
    </div>

    <div v-if="showCategoryChips" class="w-full bg-bg py-3">
      <div class="container-pop">
        <MenuCategoryChips
          :items="chipItems"
          :active-category="activeCategory"
          @update:active-category="setCategory"
        />
      </div>
    </div>

    <div class="container-pop pb-8">
      <div class="mt-8 flex flex-col gap-16">
        <MenuDrinkSection
          v-if="isDrinks"
          :drinks="drinkItems"
          :drink-groups="menuData.drinkGroups"
          :active-group="activeCategory"
        />
        <MenuDishGrid
          v-else
          :categories="isKids ? kidsSections : [activeFoodCategory]"
          :modality="gridModality"
        />
      </div>
    </div>

    <button
      v-if="showScrollTop"
      type="button"
      aria-label="Volver al inicio"
      class="fixed bottom-6 right-4 z-30 flex h-12 w-12 cursor-pointer items-center justify-center rounded-pop-full border-pop border-ink shadow-pop-sm transition-opacity duration-200"
      :class="isDrinks || isKids ? 'bg-panel text-ink' : 'bg-accent text-ink'"
      @click="scrollToTop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path d="M12 4l-8 8h5v8h6v-8h5z" />
      </svg>
    </button>
  </div>
</template>
