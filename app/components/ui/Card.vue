<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface CardProps {
  accent?: 'ayce' | 'express'
  tone?: 'panel' | 'bg2'
  shadowSize?: 'lg' | 'sm'
}

const props = withDefaults(defineProps<CardProps>(), {
  accent: 'ayce',
  tone: 'panel',
  shadowSize: 'lg',
})

const toneClass = computed(() =>
  props.tone === 'panel' ? 'bg-panel' : 'bg-bg2'
)

const shadowClass = computed(() =>
  props.shadowSize === 'lg' ? 'shadow-pop' : 'shadow-pop-sm'
)

const rootClasses = computed(() =>
  cx(
    'rounded-pop border-pop border-ink p-6 text-ink',
    toneClass.value,
    shadowClass.value,
    props.accent === 'express' && 'scope-express'
  )
)
</script>

<template>
  <div :class="rootClasses">
    <slot />
  </div>
</template>
