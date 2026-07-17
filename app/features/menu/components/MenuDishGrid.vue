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

/**
 * The sauce heat-thermometer legend graphic mounts ONCE per "Alitas &
 * Boneless" ("wings") category section — never per dish (research.md R4) — a
 * single swappable asset reference with no hardcoded crop/positioning
 * (FR-012, so any future designer revision remains a drop-in file swap with
 * zero code changes).
 */
function showThermometer(category: FullMenuCategory): boolean {
  return category.key === 'wings'
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
           Same yellow-pop treatment as the drink-group promo note. `w-fit
           max-w-full` (feature 028, Part D) sizes the box to its text content
           instead of always stretching full-width — hugs short text (wings
           note) while long text (kids note) still wraps/fills naturally. -->
      <div
        v-if="categoryNote(category)"
        data-testid="category-note"
        class="mb-6 w-fit max-w-full rounded-pop border-pop border-ink bg-yellow px-4 py-3 font-disp font-extrabold text-kicker shadow-pop-sm"
      >
        {{ categoryNote(category) }}
      </div>
      <!-- Section-level heat-thermometer legend (feature 028, Part B) — sized
           to be actually read (mild → spicy across the sauce catalog), not a
           small decorative icon: full section width on mobile, spanning up to
           the page's own max-width on desktop (client feedback: err bigger,
           noticeably larger than a per-dish card image). -->
      <img
        v-if="showThermometer(category)"
        data-testid="wings-thermometer"
        class="mb-6 h-auto w-full"
        src="/menu/thermometer/sauce-heat-thermometer.webp"
        :alt="t('menu.wings.thermometer_alt')"
        loading="lazy"
        decoding="async"
      />
      <p v-if="category.dishes.length === 0" class="text-soft">
        {{ t('menu.category.empty') }}
      </p>
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
      >
        <!-- Every dish renders via the same MenuDishCard, uniformly — the
             per-dish differences (Garantía badge, highlighted background,
             DB-driven option-group pickers) are all prop-driven, not a
             per-dish component swap (feature 027 Part C, revised). -->
        <MenuDishCard
          v-for="dish in category.dishes"
          :key="dish.id"
          :dish="dish"
          :modality="modality"
          :highlight-background="dish.highlightBackground"
        />
      </div>
    </section>
  </div>
</template>
