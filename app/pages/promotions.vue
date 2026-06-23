<script setup lang="ts">
import { usePromotions } from '@/features/promotions/composables/usePromotions'
import type { PromotionsResult } from '@/types/content'

const { t } = useI18n()

useSeoMeta({
  title: () => t('promotions.seo.title'),
  description: () => t('promotions.seo.description'),
})

const { data } = await useAsyncData<PromotionsResult>('promotions-page', () =>
  $fetch<PromotionsResult>('/api/v1/content/promotions?all=1')
)

const { lightboxState, openLightbox, closeLightbox } = usePromotions()
</script>

<template>
  <main class="container-pop py-12">
    <UiPageHeader
      :badge="t('promotions.page.badge')"
      badge-tone="pink"
      :title="t('promotions.page.heading')"
    />

    <PromotionsGrid
      :promotions="data?.promotions ?? []"
      :ok="data?.ok ?? false"
      @open-lightbox="openLightbox"
    />

    <UiLightbox
      :open="lightboxState.open"
      :src="lightboxState.imageUrl"
      @close="closeLightbox"
    />
  </main>
</template>
