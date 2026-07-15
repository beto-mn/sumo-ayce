<script setup lang="ts">
import type { MenuModality } from '@/types/menu'

const props = defineProps<{ activeModality: MenuModality }>()

const emit = defineEmits<{
  'update:active-modality': [modality: MenuModality]
}>()

const { t } = useI18n()
</script>

<template>
  <!-- ONE segmented rounded-pill at ALL breakpoints (design + font unchanged).
       PHONE (< sm): FILLS its row (`flex w-full`, matching the stacked nav) with
       both segments sharing it (`flex-1`). TABLET/DESKTOP (sm+): natural width
       that wraps as a whole pill; labels stay `whitespace-nowrap` (one line, no
       cramming) — no cut-off, no horizontal scroll. -->
  <div
    class="flex w-full max-w-full rounded-pop-full border-pop border-ink bg-panel shadow-pop-sm sm:inline-flex sm:w-auto"
    role="group"
    :aria-label="t('menu.modality.buffet') + ' / ' + t('menu.modality.carta')"
  >
    <button
      type="button"
      class="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-pop-full px-5 py-2 text-center font-disp font-extrabold uppercase text-kicker transition-colors duration-150 sm:flex-none"
      :class="activeModality === 'buffet' ? 'bg-ink text-bg' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeModality === 'buffet'"
      @click="emit('update:active-modality', 'buffet')"
    >
      {{ t('menu.modality.buffet') }}
    </button>
    <button
      type="button"
      class="flex min-h-[44px] flex-1 cursor-pointer items-center justify-center whitespace-nowrap rounded-pop-full px-5 py-2 text-center font-disp font-extrabold uppercase text-kicker transition-colors duration-150 sm:flex-none"
      :class="activeModality === 'carta' ? 'bg-ink text-bg' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeModality === 'carta'"
      @click="emit('update:active-modality', 'carta')"
    >
      {{ t('menu.modality.carta') }}
    </button>
  </div>
</template>
