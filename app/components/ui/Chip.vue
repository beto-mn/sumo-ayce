<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface ChipProps {
  active?: boolean
  accent?: 'ayce' | 'express'
  as?: 'button' | 'span'
}

const props = withDefaults(defineProps<ChipProps>(), {
  active: false,
  accent: 'ayce',
  as: 'button',
})

const classes = computed(() =>
  cx(
    'inline-flex items-center gap-2 rounded-pop-full px-4 py-2',
    'border-pop-sm border-ink font-disp font-extrabold uppercase text-kicker',
    'min-h-[44px] transition-colors duration-150',
    'focus-visible:outline-none focus-visible:ring-pop focus-visible:ring-accent',
    // Native <button> has no pointer cursor by default; add it for the clickable variant.
    props.as === 'button' && 'cursor-pointer',
    props.active ? 'bg-ink text-bg' : 'bg-panel text-ink hover:bg-bg2',
    props.accent === 'express' && 'scope-express'
  )
)
</script>

<template>
  <component :is="as" :class="classes" :type="as === 'button' ? 'button' : undefined">
    <slot />
  </component>
</template>
