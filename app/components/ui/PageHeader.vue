<script setup lang="ts">
type BadgeTone = 'ink' | 'accent' | 'orange' | 'pink' | 'blue' | 'yellow'

interface Props {
  badge: string
  badgeTone?: BadgeTone
  title: string
  subtitle?: string
}

withDefaults(defineProps<Props>(), { badgeTone: 'orange' })
</script>

<template>
  <header class="mb-8">
    <UiKicker :tone="badgeTone" :rotate="-3">{{ badge }}</UiKicker>
    <h1 class="mt-3 font-disp text-h-lg font-extrabold text-ink">{{ title }}</h1>
    <p v-if="subtitle" class="mt-3 max-w-prose font-body text-lead text-soft">
      {{ subtitle }}
    </p>
  </header>
</template>
