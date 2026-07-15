<script setup lang="ts">
import type { FullMenuCategory, MenuModality } from '@/types/menu'

defineProps<{
  categories: FullMenuCategory[]
  modality: MenuModality
}>()

const { t, locale } = useI18n()

/** Heading = DB category name (single source of truth), locale-aware. */
function categoryName(category: FullMenuCategory): string {
  return category.name[locale.value as 'es' | 'en'] || category.name.es
}

/** Optional section note (e.g. Kids "Combo Infantil" inclusions), locale-aware; null → hidden. */
function categoryNote(category: FullMenuCategory): string | null {
  if (!category.note) return null
  return category.note[locale.value as 'es' | 'en'] || category.note.es
}
</script>

<template>
  <div class="flex flex-col gap-12">
    <section
      v-for="(category, index) in categories"
      :id="category.key"
      :key="`${category.key}-${index}`"
      class="scroll-mt-24"
    >
      <h2 class="mb-6 font-disp font-extrabold uppercase text-h-lg">
        {{ categoryName(category) }}
      </h2>
      <!-- Optional section note at the TOP (e.g. Kids "Combo Infantil" inclusions).
           Same yellow-pop treatment as the drink-group promo note. -->
      <div
        v-if="categoryNote(category)"
        data-testid="category-note"
        class="mb-6 rounded-pop border-pop border-ink bg-yellow px-4 py-3 font-disp font-extrabold text-kicker shadow-pop-sm"
      >
        {{ categoryNote(category) }}
      </div>
      <p v-if="category.dishes.length === 0" class="text-soft">
        {{ t('menu.category.empty') }}
      </p>
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
      >
        <MenuDishCard
          v-for="dish in category.dishes"
          :key="dish.id"
          :dish="dish"
          :modality="modality"
        />
      </div>
    </section>
  </div>
</template>
