<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface StickerProps {
  tone?: 'yellow' | 'pink'
  rotate?: number
}

const props = withDefaults(defineProps<StickerProps>(), {
  tone: 'yellow',
  rotate: -8,
})

const classes = computed(() =>
  cx(
    'inline-flex items-center justify-center',
    'rounded-pop border-pop border-ink px-4 py-2',
    'font-disp font-extrabold uppercase text-kicker text-ink',
    'shadow-pop-sm',
    props.tone === 'yellow' ? 'bg-yellow' : 'bg-pink text-bg'
  )
)

const style = computed(() => ({ transform: `rotate(${props.rotate}deg)` }))
</script>

<template>
  <span :class="classes" :style="style">
    <slot />
  </span>
</template>
