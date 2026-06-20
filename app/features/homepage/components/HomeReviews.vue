<script setup lang="ts">
import type { Review } from '@/types/content'

defineProps<{ reviews: Review[] }>()

const { t } = useI18n()
</script>

<template>
  <section
    v-if="reviews.length > 0"
    class="flex flex-col gap-6"
    :aria-label="t('home.reviews.title')"
  >
    <header class="flex flex-col items-start gap-[0.875rem]">
      <UiKicker tone="yellow">★ {{ t('home.reviews.kicker') }}</UiKicker>
      <h2
        class="m-0 font-disp font-extrabold uppercase leading-none tracking-[-0.02em] text-h-lg text-ink"
      >
        {{ t('home.reviews.title') }}
      </h2>
    </header>
    <div
      class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]"
    >
      <ReviewCard v-for="review in reviews" :key="review.id" :review="review" />
    </div>
  </section>
</template>
