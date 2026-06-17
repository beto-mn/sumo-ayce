<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface KickerProps {
  tone?: 'ink' | 'accent'
  rotate?: number
}

const props = withDefaults(defineProps<KickerProps>(), {
  tone: 'ink',
  rotate: -2,
})

const classes = computed(() =>
  cx(
    'inline-flex items-center rounded-pop-full px-3 py-1',
    'font-disp font-extrabold uppercase text-kicker',
    props.tone === 'ink' ? 'bg-ink text-bg' : 'bg-accent text-bg'
  )
)

const style = computed(() => ({ transform: `rotate(${props.rotate}deg)` }))
</script>

<template>
  <span :class="classes" :style="style">
    <slot />
  </span>
</template>
