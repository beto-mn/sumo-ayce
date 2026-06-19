<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface KickerProps {
  tone?: 'ink' | 'accent' | 'orange' | 'pink' | 'blue' | 'yellow'
  rotate?: number
}

const props = withDefaults(defineProps<KickerProps>(), {
  tone: 'ink',
  rotate: -2,
})

const toneClasses = {
  ink: 'bg-ink text-bg',
  accent: 'bg-accent text-bg',
  orange: 'bg-orange text-bg',
  pink: 'bg-pink text-bg',
  blue: 'bg-blue text-bg',
  yellow: 'bg-yellow text-ink',
} as const

const classes = computed(() =>
  cx(
    'inline-flex items-center gap-2 rounded-pop-full px-[14px] py-[7px]',
    'font-disp font-extrabold uppercase text-kicker tracking-[0.04em]',
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
