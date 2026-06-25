<script setup lang="ts">
import type { MenuModality } from '@/types/menu'

const props = defineProps<{ activeModality: MenuModality }>()

const emit = defineEmits<{
  'update:active-modality': [modality: MenuModality]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="inline-flex rounded-pop-full border-pop border-ink bg-panel shadow-pop-sm"
    role="group"
    :aria-label="t('menu.modality.buffet') + ' / ' + t('menu.modality.carta')"
  >
    <button
      type="button"
      class="rounded-pop-full px-5 py-2 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[44px]"
      :class="activeModality === 'buffet' ? 'bg-ink text-bg' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeModality === 'buffet'"
      @click="emit('update:active-modality', 'buffet')"
    >
      {{ t('menu.modality.buffet') }}
    </button>
    <button
      type="button"
      class="rounded-pop-full px-5 py-2 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[44px]"
      :class="activeModality === 'carta' ? 'bg-ink text-bg' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeModality === 'carta'"
      @click="emit('update:active-modality', 'carta')"
    >
      {{ t('menu.modality.carta') }}
    </button>
  </div>
</template>
