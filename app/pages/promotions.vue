<script setup lang="ts">
import { computed } from 'vue'
import type { PromotionsResult } from '@/types/content'

const { t } = useI18n()

useSeoMeta({
  title: () => t('promotions.seo.title'),
  description: () => t('promotions.seo.description'),
})

const { data } = await useAsyncData<PromotionsResult>('promotions-page', () =>
  $fetch<PromotionsResult>('/api/v1/content/promotions?all=1')
)

const promotions = computed(() => data.value?.promotions ?? [])
const isEmpty = computed(
  () => promotions.value.length === 0 || data.value?.ok === false
)
</script>

<template>
  <main class="container-pop py-12">
    <UiPageHeader
      :badge="t('promotions.page.badge')"
      badge-tone="pink"
      :title="t('promotions.page.heading')"
    />

    <p
      v-if="isEmpty"
      data-testid="empty-state"
      class="py-12 text-center font-body text-soft"
    >
      {{ t('promotions.empty') }}
    </p>
    <UiPromotionsCarousel v-else :promotions="promotions" />
  </main>
</template>
