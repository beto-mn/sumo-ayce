<script setup lang="ts">
import { computed } from 'vue'

/**
 * Global full-bleed dark marquee band shown directly below the nav. Phrases are
 * editable via i18n (`home.marquee` array, ES/EN) and separated by an orange star.
 * Reduced-motion is honored by the underlying `UiMarquee`.
 */
const { tm, rt } = useI18n()

const phrases = computed<string[]>(() => {
  const raw = tm('home.marquee') as unknown
  if (!Array.isArray(raw)) return []
  return raw.map(entry => rt(entry as never))
})
</script>

<template>
  <UiMarquee tone="ink" speed="slow" class="site-marquee">
    <template v-for="(phrase, index) in phrases" :key="index">
      <span class="font-disp font-extrabold uppercase text-kicker">{{
        phrase
      }}</span>
      <span
        class="font-disp font-extrabold uppercase text-kicker text-orange"
        aria-hidden="true"
        >✺</span
      >
    </template>
  </UiMarquee>
</template>
