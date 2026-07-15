<script setup lang="ts">
import { computed, ref } from 'vue'
import type { PickerOption } from '@/features/menu/types'

/**
 * Single-active option picker reused for BOTH the Wings sauce selection and the
 * Vaso Sumo flavour selection (Article I DRY — one parameterized component, not
 * two). `spiceLevel` is optional and only drives the chili indicator (sauces).
 */

const props = defineProps<{
  options: PickerOption[]
  /** i18n-resolved heading, e.g. "Elige tu salsa" or "Elige tu base". */
  pickerLabel: string
  /** When true (sauces), sort by spice level ascending. */
  sortBySpice?: boolean
}>()

const { t } = useI18n()

const selectedId = ref<string | null>(props.options[0]?.id ?? null)

const sorted = computed(() =>
  props.sortBySpice
    ? [...props.options].sort(
        (a, b) => (a.spiceLevel ?? 0) - (b.spiceLevel ?? 0)
      )
    : props.options
)

function select(id: string): void {
  selectedId.value = id
}
</script>

<template>
  <div class="mt-3">
    <p class="mb-2 font-disp font-extrabold uppercase text-kicker text-soft">
      {{ pickerLabel }}
    </p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="option in sorted"
        :key="option.id"
        type="button"
        class="inline-flex cursor-pointer items-center gap-1 rounded-pop-full border-pop-sm border-ink px-3 py-1.5 font-disp font-extrabold uppercase text-kicker transition-colors duration-150 min-h-[36px]"
        :class="selectedId === option.id ? 'bg-ink text-bg' : 'bg-panel text-ink hover:bg-bg2'"
        :aria-pressed="selectedId === option.id"
        @click="select(option.id)"
      >
        <span>{{ option.label }}</span>
        <span
          v-if="option.spiceLevel != null && option.spiceLevel >= 3"
          class="text-orange"
          :aria-label="t('menu.sauce.spicy_indicator')"
        >
          {{ '🌶'.repeat(option.spiceLevel - 2) }}
        </span>
      </button>
    </div>
  </div>
</template>
