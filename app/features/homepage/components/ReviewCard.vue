<script setup lang="ts">
import { computed } from 'vue'
import { pickLocale } from '@/features/homepage/utils/bilingual'
import type { Review } from '@/types/content'

const props = defineProps<{ review: Review }>()

const { t, locale } = useI18n()

const text = computed(() => pickLocale(props.review.text, locale.value))
const stars = computed(() =>
  Array.from({ length: 5 }, (_, i) => i < props.review.rating)
)
const ratingLabel = computed(() =>
  t('home.reviews.ratingLabel', { rating: props.review.rating })
)
</script>

<template>
  <UiCard class="review-card flex flex-col gap-3" tone="bg2" shadow-size="sm">
    <div class="flex gap-[0.15rem] text-stars" :aria-label="ratingLabel">
      <span
        v-for="(on, i) in stars"
        :key="i"
        :class="on ? 'text-yellow' : 'text-line/25'"
        aria-hidden="true"
        >★</span
      >
    </div>
    <p class="text-body">{{ text }}</p>
    <p class="font-disp font-extrabold uppercase text-kicker">
      {{ review.authorName }}
    </p>
  </UiCard>
</template>
