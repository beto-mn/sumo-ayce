<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMenuFilters } from '@/features/menu/composables/useMenuFilters'
import type { MenuType } from '@/features/menu/types'
import type {
  FullMenuCategory,
  FullMenuResult,
  MenuCategoryKey,
} from '@/types/menu'

const props = defineProps<{
  menuData: FullMenuResult
  initialType: MenuType
  initialModality: 'buffet' | 'carta'
}>()

const { t } = useI18n()

const {
  activeType,
  activeModality,
  activeCategory,
  showModalityToggle,
  accentStyle,
  setType,
  setModality,
  setCategory,
} = useMenuFilters(props.initialType, props.initialModality)

const foodCategories = computed(() =>
  props.menuData.categories.filter(c => c.key !== 'drinks')
)

const drinkItems = computed(() => {
  const drinkCat = props.menuData.categories.find(c => c.key === 'drinks')
  return drinkCat?.dishes ?? []
})

const hasDrinks = computed(() => drinkItems.value.length > 0)

const activeDrinkGroup = ref<string | null>(null)

const availableDrinkGroups = computed((): FullMenuCategory[] => {
  const seen = new Set<string>()
  const groups: FullMenuCategory[] = []
  for (const d of drinkItems.value) {
    if (d.drinkGroup && !seen.has(d.drinkGroup)) {
      seen.add(d.drinkGroup)
      groups.push({
        key: d.drinkGroup as MenuCategoryKey,
        name: { es: d.drinkGroup, en: d.drinkGroup },
        displayOrder: 0,
        dishes: [],
      })
    }
  }
  return groups
})

function toggleDrinks(): void {
  if (activeCategory.value === 'drinks') {
    setCategory(null)
    activeDrinkGroup.value = null
  } else {
    setCategory('drinks')
    activeDrinkGroup.value = null
  }
}

function setDrinkGroup(key: string | null): void {
  activeDrinkGroup.value = key
}

const visibleFoodCategories = computed(() => {
  if (!activeCategory.value || activeCategory.value === 'drinks')
    return foodCategories.value
  return foodCategories.value.filter(c => c.key === activeCategory.value)
})

const showFoods = computed(
  () => !activeCategory.value || activeCategory.value !== 'drinks'
)
const showDrinks = computed(
  () => !activeCategory.value || activeCategory.value === 'drinks'
)

const inDrinksMode = computed(() => activeCategory.value === 'drinks')

const showScrollTop = ref(false)

function onScroll() {
  showScrollTop.value = window.scrollY > 300
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onUnmounted(() => window.removeEventListener('scroll', onScroll))
</script>

<template>
  <div :style="inDrinksMode ? { '--accent': 'var(--soft)' } : accentStyle">
    <div class="container-pop pt-8">
      <div class="mb-8 flex flex-wrap items-center gap-4">
        <MenuTypeToggle
          :active-type="activeType"
          @update:active-type="setType"
        />
        <MenuModalityToggle
          v-if="showModalityToggle"
          :active-modality="activeModality"
          @update:active-modality="setModality"
        />
        <button
          v-if="hasDrinks"
          type="button"
          class="inline-flex min-h-[44px] items-center rounded-pop-full border-pop border-ink px-5 py-2 font-disp font-extrabold uppercase text-kicker transition-colors duration-150"
          :class="inDrinksMode ? 'bg-ink text-panel' : 'bg-panel text-ink shadow-pop-sm hover:bg-bg2'"
          @click="toggleDrinks"
        >
          {{ t('menu.category.drinks') }}
        </button>
      </div>
    </div>

    <div class="w-full bg-bg py-3">
      <div class="container-pop">
        <MenuCategoryChips
          v-if="!inDrinksMode"
          :categories="foodCategories"
          :active-category="activeCategory"
          @update:active-category="setCategory"
        />
        <MenuCategoryChips
          v-else
          :categories="availableDrinkGroups"
          :active-category="activeDrinkGroup"
          translation-prefix="menu.drink_group"
          @update:active-category="setDrinkGroup"
        />
      </div>
    </div>

    <div class="container-pop pb-8">
      <div class="mt-8 flex flex-col gap-16">
        <MenuDishGrid
          v-if="showFoods"
          :categories="visibleFoodCategories"
          :sauces="menuData.sauces"
          :modality="activeModality"
        />
        <MenuDrinkSection
          v-if="showDrinks && hasDrinks"
          :drinks="drinkItems"
          :active-group="activeDrinkGroup"
        />
      </div>
    </div>

    <button
      v-if="showScrollTop"
      type="button"
      aria-label="Volver al inicio"
      class="fixed bottom-6 right-4 z-30 flex h-12 w-12 items-center justify-center rounded-pop-full border-pop border-ink shadow-pop-sm transition-opacity duration-200"
      :class="inDrinksMode ? 'bg-panel text-ink' : 'bg-accent text-ink'"
      @click="scrollToTop"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5">
        <path d="M12 4l-8 8h5v8h6v-8h5z" />
      </svg>
    </button>
  </div>
</template>
