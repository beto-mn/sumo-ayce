<script setup lang="ts">
import { reactive } from 'vue'
import type { Promotion } from '@/types/content'

defineProps<{ promotions: Promotion[] }>()

const { t } = useI18n()
const localePath = useLocalePath()

const lightbox = reactive({
  open: false,
  src: null as string | null,
  alt: '',
})

function openLightbox(payload: { src: string; alt: string }): void {
  lightbox.open = true
  lightbox.src = payload.src
  lightbox.alt = payload.alt
}
</script>

<template>
  <section
    v-if="promotions.length > 0"
    class="flex flex-col gap-6"
    :aria-label="t('home.promotions.title')"
  >
    <header class="flex flex-wrap items-center justify-between gap-4">
      <UiKicker tone="pink">{{ t('home.promotions.kicker') }}</UiKicker>
      <NuxtLink :to="localePath('/promociones')" class="no-underline">
        <UiButton variant="ghost" size="sm">
          {{ t('home.promotions.cta') }} →
        </UiButton>
      </NuxtLink>
    </header>
    <div
      class="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]"
    >
      <PromoCard
        v-for="promo in promotions"
        :key="promo.id"
        :promo="promo"
        @open="openLightbox"
      />
    </div>
    <UiLightbox
      :open="lightbox.open"
      :src="lightbox.src"
      :alt="lightbox.alt"
      @close="lightbox.open = false"
    />
  </section>
</template>
