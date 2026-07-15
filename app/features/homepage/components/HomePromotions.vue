<script setup lang="ts">
import type { Promotion } from '@/types/content'

defineProps<{ promotions: Promotion[] }>()

const { t } = useI18n()
</script>

<template>
  <section
    v-if="promotions.length > 0"
    class="flex flex-col gap-6"
    :aria-label="t('home.promotions.title')"
  >
    <header class="flex flex-col items-start gap-[0.875rem]">
      <UiKicker tone="pink">{{ t('home.promotions.kicker') }}</UiKicker>
      <h2
        class="m-0 font-disp font-extrabold uppercase leading-none tracking-[-0.02em] text-h-lg text-ink"
      >
        {{ t('home.promotions.title') }}
      </h2>
    </header>
    <UiPromotionsCarousel :promotions="promotions" />
  </section>
</template>
