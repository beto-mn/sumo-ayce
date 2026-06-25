<script setup lang="ts">
import type { MenuType } from '@/features/menu/types'
import type { FullMenuResult, MenuModality } from '@/types/menu'

const { t } = useI18n()
const route = useRoute()

const activeType = computed<MenuType>(() => {
  const q = route.query.type
  return q === 'express' ? 'express' : 'ayce'
})

const activeModality = computed<MenuModality>(() => {
  const q = route.query.modality
  return q === 'carta' ? 'carta' : 'buffet'
})

const { data, error } = await useAsyncData(
  () => `menu-${activeType.value}-${activeModality.value}`,
  () =>
    $fetch<FullMenuResult>('/api/v1/menu', {
      params: { type: activeType.value, modality: activeModality.value },
    })
)

useHead({
  title: computed(() =>
    activeType.value === 'express'
      ? t('menu.seo.title_express')
      : t('menu.seo.title_ayce')
  ),
  meta: [{ name: 'description', content: t('menu.seo.description') }],
})
</script>

<template>
  <div>
    <div v-if="error" class="container-pop py-16 text-center">
      <p class="text-soft">{{ error.message }}</p>
    </div>
    <MenuShell
      v-else-if="data"
      :key="`${activeType}-${activeModality}`"
      :menu-data="data"
      :initial-type="activeType"
      :initial-modality="activeModality"
    />
  </div>
</template>
