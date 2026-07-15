<script setup lang="ts">
import type { FeaturedDish } from '@/types/content'

defineProps<{ dishes: FeaturedDish[] }>()

const { t } = useI18n()
</script>

<template>
  <section
    v-if="dishes.length > 0"
    class="flex min-w-0 flex-col gap-6"
    :aria-label="t('home.featured.title')"
  >
    <header class="flex flex-col items-start gap-[0.875rem]">
      <UiKicker tone="orange">{{ t('home.featured.title') }}</UiKicker>
      <h2
        class="m-0 font-disp font-extrabold uppercase leading-none tracking-[-0.02em] text-h-lg text-ink"
      >
        {{ t('home.featured.heading') }}
      </h2>
      <p class="m-0 font-body text-lead text-soft">
        {{ t('home.featured.subtitle') }}
      </p>
    </header>
    <!-- Horizontal scroll is CONTAINED here: the track scrolls internally
         (overflow-x-auto) and never widens the page. -->
    <ul
      class="featured-rail__track m-0 flex min-w-0 list-none gap-5 overflow-x-auto px-0 pt-2 pb-3 [scroll-snap-type:x_mandatory] [-webkit-overflow-scrolling:touch] [scrollbar-width:thin] [scrollbar-color:rgb(var(--ink)/0.4)_transparent] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-bg2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-ink/40 hover:[&::-webkit-scrollbar-thumb]:bg-ink/60"
    >
      <!-- `flex` so the card can stretch to the row height; the track defaults
           to items-stretch, so every card equalizes to the tallest one. -->
      <li
        v-for="dish in dishes"
        :key="dish.id"
        class="flex flex-none [scroll-snap-align:start]"
      >
        <DishCard :dish="dish" />
      </li>
    </ul>
  </section>
</template>
