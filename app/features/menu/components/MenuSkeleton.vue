<script setup lang="ts">
import { computed } from 'vue'
import type { AyceModality, PrimarySelection } from '@/features/menu/menu-sets'
import { getCuratedSet } from '@/features/menu/menu-sets'

const props = defineProps<{
  selection: PrimarySelection
  modality: AyceModality
}>()

const { t } = useI18n()

/** Exact chip count for the destination view (feature 023 PART B). */
const chipKeys = computed(() => getCuratedSet(props.selection, props.modality))
/** Kids is a single flat list with no chip row (mirrors useMenuFilters). */
const showChips = computed(() => props.selection !== 'kids')

/** Fixed, grid-friendly placeholder count — real per-category counts are
 *  unknowable before the fetch resolves (see research.md Decision 4). */
const DISH_CARD_COUNT = 6
</script>

<template>
  <div role="status" aria-live="polite">
    <span class="sr-only">{{ t('menu.skeleton.loading') }}</span>
    <div v-if="showChips" class="mb-6 flex flex-wrap gap-2">
      <MenuChipSkeleton v-for="key in chipKeys" :key="key" />
    </div>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
      <MenuDishCardSkeleton v-for="n in DISH_CARD_COUNT" :key="n" />
    </div>
  </div>
</template>
