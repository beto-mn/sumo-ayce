<script setup lang="ts">
import { computed } from 'vue'
import type { PrimarySelection } from '@/features/menu/menu-sets'
import type { FullMenuResult, MenuModality } from '@/types/menu'

const { t } = useI18n()
const route = useRoute()

const activeSelection = computed<PrimarySelection>(() => {
  const q = route.query.type
  if (q === 'express') return 'express'
  if (q === 'kids') return 'kids'
  if (q === 'bebidas' || q === 'drinks') return 'drinks'
  return 'ayce'
})

const activeModality = computed<MenuModality>(() =>
  route.query.modality === 'carta' && activeSelection.value === 'ayce'
    ? 'carta'
    : 'buffet'
)

/**
 * The API knows `ayce | express | kids`. Bebidas reuses the AYCE response because
 * drinks are `locationType='both'` and appear in every menu; the Bebidas view is
 * a client-side slice over those drinks. Kids has its own cross-cutting view.
 */
const apiType = computed<'ayce' | 'express' | 'kids'>(() => {
  if (activeSelection.value === 'express') return 'express'
  if (activeSelection.value === 'kids') return 'kids'
  return 'ayce'
})

const { data, error, status } = await useAsyncData(
  () => `menu-${apiType.value}-${activeModality.value}`,
  () =>
    $fetch<FullMenuResult>('/api/v1/menu', {
      params: { type: apiType.value, modality: activeModality.value },
    }),
  {
    getCachedData: (key, nuxtApp) =>
      nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
  }
)

/**
 * The API degrades to an empty result (HTTP 200) when Neon is transiently
 * unavailable, so a truthy-but-empty payload means "menu temporarily
 * unavailable" — render a friendly state rather than an empty shell.
 */
const isUnavailable = computed(
  () =>
    !!data.value &&
    data.value.categories.length === 0 &&
    data.value.drinkGroups.length === 0
)

/**
 * `status` transitions to 'pending' both on first mount and whenever the
 * fetch key changes (type/modality switch) — the same mechanism covers both
 * a cold load and a client-side switch (feature 023 PART B).
 */
const isLoading = computed(() => status.value === 'pending')

useHead({
  title: computed(() =>
    activeSelection.value === 'express'
      ? t('menu.seo.title_express')
      : t('menu.seo.title_ayce')
  ),
  meta: [{ name: 'description', content: t('menu.seo.description') }],
})
</script>

<template>
  <div>
    <div
      v-if="error || isUnavailable"
      class="container-pop py-16 text-center"
    >
      <p class="text-soft">{{ t('menu.unavailable') }}</p>
    </div>
    <MenuSkeleton
      v-else-if="isLoading"
      class="container-pop py-8"
      :selection="activeSelection"
      :modality="activeModality"
    />
    <MenuShell
      v-else-if="data"
      :key="`${activeSelection}-${activeModality}`"
      :menu-data="data"
      :initial-selection="activeSelection"
      :initial-modality="activeModality"
    />
  </div>
</template>
