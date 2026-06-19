<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

interface ButtonProps {
  variant?: 'primary' | 'ink' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
})

const sizeClasses = {
  sm: 'px-4 py-[9px] text-sm min-h-[40px]',
  md: 'px-6 py-[14px] text-base min-h-[50px]',
  lg: 'px-8 py-[18px] text-lg min-h-[58px]',
} as const

const variantClasses = {
  primary: 'bg-accent text-bg',
  ink: 'bg-ink text-bg',
  ghost: 'bg-panel text-ink',
} as const

const classes = computed(() =>
  cx(
    'inline-flex items-center justify-center gap-2',
    'rounded-pop-full border-pop border-ink font-disp font-extrabold',
    'shadow-pop-sm transition-transform duration-200',
    'hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop',
    'active:translate-x-0 active:translate-y-0 active:shadow-pop-sm',
    'focus-visible:outline-none focus-visible:ring-pop focus-visible:ring-accent',
    sizeClasses[props.size],
    variantClasses[props.variant],
    props.disabled &&
      'opacity-60 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-pop-sm',
    props.loading && 'cursor-wait'
  )
)
</script>

<template>
  <button
    :type="type"
    :class="classes"
    :disabled="disabled || loading"
    :aria-busy="loading || undefined"
  >
    <span
      v-if="loading"
      class="inline-block h-4 w-4 animate-spin rounded-pop-full border-2 border-bg border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
