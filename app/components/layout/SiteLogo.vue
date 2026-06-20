<script setup lang="ts">
import { computed } from 'vue'
import { cx } from '@/utils/cx'

/**
 * Shared SUMO brand mark used by both `SiteHeader` (UiNav `#logo` slot) and
 * `SiteFooter`. Renders the ORIGINAL, unmodified horizontal lockup
 * (`/brand/sumo-horizontal.svg`).
 *
 * The logo is rendered BARE — no backing box. The SVG carries its own black
 * sticker outline around the white "SUMO", so it stays legible on the cream
 * nav (exactly like the hero logo on cream) and the white wordmark shows on the
 * ink footer. The SVG itself is never recolored.
 */
interface SiteLogoProps {
  /** Localized destination for the wrapping link. */
  to?: string
  /** Accessible label for the link. */
  label?: string
  /** Visual size. `default` ~40px tall in the nav; `small` for tight spots. */
  size?: 'default' | 'small'
}

const props = withDefaults(defineProps<SiteLogoProps>(), {
  to: '/',
  label: 'SUMO — All You Can Eat',
  size: 'default',
})

const imgClasses = computed(() =>
  cx('block w-auto', props.size === 'small' ? 'h-7' : 'h-10')
)
</script>

<template>
  <NuxtLink
    :to="to"
    class="inline-flex items-center"
    :aria-label="label"
    data-logo="sumo"
  >
    <img
      src="/brand/sumo-horizontal.svg"
      :alt="label"
      :class="imgClasses"
    />
  </NuxtLink>
</template>
