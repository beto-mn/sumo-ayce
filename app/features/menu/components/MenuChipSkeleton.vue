<script setup lang="ts">
/**
 * A single pill-shaped loading placeholder sized to match `UiChip`'s
 * dimensions (min-h-[44px], rounded-pop-full, border-pop-sm). No props —
 * `MenuSkeleton` renders one instance per curated-set entry.
 */
</script>

<template>
  <UiSkeleton
    shape="pill"
    class="h-11 w-24 border-pop-sm border-ink"
  />
</template>
