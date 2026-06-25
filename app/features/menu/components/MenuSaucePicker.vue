<script setup lang="ts">
import { computed, ref } from 'vue'
import type { FullMenuSauce } from '@/types/menu'

const props = defineProps<{ sauces: FullMenuSauce[] }>()

const { t } = useI18n()

const selectedId = ref<string | null>(null)

const sorted = computed(() =>
  [...props.sauces].sort((a, b) => a.spiceLevel - b.spiceLevel)
)

function select(id: string): void {
  selectedId.value = selectedId.value === id ? null : id
}
</script>

<template>
  <div class="mt-3">
    <p class="mb-2 font-disp font-extrabold uppercase text-kicker text-soft">
      {{ t('menu.dish.sauce_required') }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="sauce in sorted"
        :key="sauce.id"
        type="button"
        class="inline-flex items-center gap-1 rounded-pop-full border-pop-sm border-ink px-3 py-1.5 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[36px]"
        :class="selectedId === sauce.id ? 'bg-ink text-bg' : 'bg-panel text-ink hover:bg-bg2'"
        @click="select(sauce.id)"
      >
        <span>{{ sauce.name.es }}</span>
        <span
          v-if="sauce.spiceLevel >= 3"
          class="text-orange"
          :aria-label="t('menu.sauce.spicy_indicator')"
        >
          {{ '🌶'.repeat(sauce.spiceLevel - 2) }}
        </span>
      </button>
    </div>
  </div>
</template>
