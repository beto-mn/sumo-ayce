<script setup lang="ts">
/** An ordered chip: its stable `key` plus the display `label` to render. */
export interface CategoryChip {
  key: string
  label: string
}

defineProps<{
  /** Ordered curated set of chips with their resolved (DB-sourced) labels. */
  items: CategoryChip[]
  activeCategory: string
}>()

const emit = defineEmits<{
  'update:active-category': [key: string]
}>()
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UiChip
      v-for="item in items"
      :key="item.key"
      :active="activeCategory === item.key"
      @click="emit('update:active-category', item.key)"
    >
      {{ item.label }}
    </UiChip>
  </div>
</template>
