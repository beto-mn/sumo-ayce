<script setup lang="ts">
import type { PrimarySelection } from '@/features/menu/menu-sets'

defineProps<{ activeSelection: PrimarySelection }>()

const emit = defineEmits<{
  'update:selection': [selection: PrimarySelection]
}>()

const { t } = useI18n()

/**
 * The restaurant-type segmented pill: AYCE and Express are the two mutually
 * exclusive restaurant experiences (AYCE keeps its modality sub-toggle). Bebidas
 * and Kids are cross-cutting views rendered as INDEPENDENT standalone buttons.
 */
const restaurantOptions: {
  value: PrimarySelection
  labelKey: string
  activeClass: string
}[] = [
  {
    value: 'ayce',
    labelKey: 'menu.type.ayce',
    activeClass: 'bg-orange text-panel',
  },
  {
    value: 'express',
    labelKey: 'menu.type.express',
    activeClass: 'bg-blue text-panel',
  },
]

/** Standalone cross-cutting buttons (available regardless of AYCE/Express). */
const standaloneOptions: {
  value: PrimarySelection
  labelKey: string
  activeClass: string
}[] = [
  {
    value: 'drinks',
    labelKey: 'menu.type.drinks',
    activeClass: 'bg-ink text-panel',
  },
  {
    value: 'kids',
    labelKey: 'menu.type.kids',
    activeClass: 'bg-ink text-panel',
  },
]
</script>

<template>
  <!-- PHONE (< sm, <520px): each nav GROUP stacks on its OWN full-width row
       (AYCE|Express pill, then the modality slot when AYCE is active, then
       Bebidas, then Kids) — clean, no cramping, pop-shadow never clipped.
       TABLET (sm–md, 520–880px, incl. iPad Air 820): groups take their NATURAL
       content width and WRAP (flex-wrap), packing into as few rows as fit (1–2)
       instead of four stacked rows. DESKTOP (≥ md): single horizontal row.
       The AYCE|Express pill stays a single segmented pill at all breakpoints. -->
  <div class="flex w-full max-w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
    <div
      class="flex w-full rounded-pop-full border-pop border-ink bg-panel shadow-pop-sm sm:inline-flex sm:w-auto"
      role="group"
      :aria-label="t('menu.type.selector_label')"
    >
      <button
        v-for="option in restaurantOptions"
        :key="option.value"
        type="button"
        class="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-pop-full px-5 py-2 text-center font-disp font-extrabold uppercase text-kicker transition-colors duration-150 sm:flex-none"
        :class="activeSelection === option.value ? option.activeClass : 'bg-transparent text-ink hover:bg-bg2'"
        :aria-pressed="activeSelection === option.value"
        @click="emit('update:selection', option.value)"
      >
        {{ t(option.labelKey) }}
      </button>
    </div>

    <!-- The AYCE modality sub-toggle slots in HERE (its own full-width row on
         phone, natural width that wraps at sm+) — between the restaurant pill and
         the standalone Bebidas/Kids buttons — when AYCE is active. -->
    <slot name="modality" />

    <button
      v-for="option in standaloneOptions"
      :key="option.value"
      type="button"
      class="flex min-h-[44px] w-full cursor-pointer items-center justify-center whitespace-nowrap rounded-pop-full border-pop border-ink px-5 py-2 text-center font-disp font-extrabold uppercase text-kicker shadow-pop-sm transition-colors duration-150 sm:w-auto"
      :class="activeSelection === option.value ? option.activeClass : 'bg-panel text-ink hover:bg-bg2'"
      :aria-pressed="activeSelection === option.value"
      @click="emit('update:selection', option.value)"
    >
      {{ t(option.labelKey) }}
    </button>
  </div>
</template>
