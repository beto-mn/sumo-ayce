<script setup lang="ts">
import type { MenuType } from '@/features/menu/types'

const props = defineProps<{ activeType: MenuType }>()

const emit = defineEmits<{
  'update:active-type': [type: MenuType]
}>()

const { t } = useI18n()
</script>

<template>
  <div
    class="inline-flex rounded-pop-full border-pop border-ink bg-panel shadow-pop-sm"
    role="group"
    :aria-label="t('menu.type.ayce') + ' / ' + t('menu.type.express')"
  >
    <button
      type="button"
      class="rounded-pop-full px-5 py-2 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[44px]"
      :class="activeType === 'ayce' ? 'bg-orange text-panel' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeType === 'ayce'"
      @click="emit('update:active-type', 'ayce')"
    >
      {{ t('menu.type.ayce') }}
    </button>
    <button
      type="button"
      class="rounded-pop-full px-5 py-2 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[44px]"
      :class="activeType === 'express' ? 'bg-blue text-panel' : 'bg-transparent text-ink hover:bg-bg2'"
      :aria-pressed="activeType === 'express'"
      @click="emit('update:active-type', 'express')"
    >
      {{ t('menu.type.express') }}
    </button>
  </div>
</template>
