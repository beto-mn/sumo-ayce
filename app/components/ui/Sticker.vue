<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface StickerProps {
  tone?: 'yellow' | 'pink' | 'orange' | 'blue' | 'green'
  rotate?: number
}

const props = withDefaults(defineProps<StickerProps>(), {
  tone: 'yellow',
  rotate: -8,
})

const toneClasses = {
  yellow: 'bg-yellow text-ink',
  pink: 'bg-pink text-bg',
  orange: 'bg-orange text-bg',
  blue: 'bg-blue text-bg',
  green: 'bg-green text-bg',
} as const

const classes = computed(() =>
  cx(
    'inline-flex items-center justify-center',
    'rounded-pop border-pop border-ink px-4 py-2',
    'font-disp font-extrabold uppercase text-kicker',
    'shadow-pop-sm',
    toneClasses[props.tone]
  )
)

const style = computed(() => ({ transform: `rotate(${props.rotate}deg)` }))
</script>

<template>
  <span :class="classes" :style="style">
    <slot />
  </span>
</template>
