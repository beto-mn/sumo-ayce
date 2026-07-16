<script setup lang="ts">
import { computed } from 'vue'

interface UiSkeletonProps {
  /** Visual shape of the placeholder. Sizing is left to the consumer via
   *  `class` passthrough (Vue's automatic attribute inheritance) — this
   *  primitive carries no width/height props. */
  shape?: 'rect' | 'pill' | 'circle'
}

const props = withDefaults(defineProps<UiSkeletonProps>(), {
  shape: 'rect',
})

const roundingClass = computed(() =>
  props.shape === 'rect' ? 'rounded-pop-sm' : 'rounded-pop-full'
)
</script>

<template>
  <div
    aria-hidden="true"
    class="bg-bg2 animate-pulse motion-reduce:animate-none"
    :class="roundingClass"
  />
</template>
