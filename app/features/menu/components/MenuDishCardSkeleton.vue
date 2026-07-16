<script setup lang="ts">
/**
 * A single placeholder card matching `MenuDishCard.vue`'s outer shell
 * (image area + title line + description line). No props — `MenuSkeleton`
 * renders a fixed count of these regardless of destination category.
 */
</script>

<template>
  <div
    class="flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm"
  >
    <UiSkeleton class="h-44 w-full" />
    <UiSkeleton class="h-5 w-3/4" />
    <UiSkeleton class="h-4 w-full" />
  </div>
</template>
