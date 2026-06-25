<script setup lang="ts">
import { computed } from 'vue'
import type { FullMenuDish, FullMenuSauce, MenuModality } from '@/types/menu'

const props = defineProps<{
  dish: FullMenuDish
  sauces: FullMenuSauce[]
  modality: MenuModality
}>()

const { t, locale } = useI18n()

const dishName = computed(
  () => props.dish.name[locale.value as 'es' | 'en'] ?? props.dish.name.es
)
const dishDesc = computed(
  () =>
    props.dish.description[locale.value as 'es' | 'en'] ??
    props.dish.description.es
)
const dishBadge = computed(() => {
  if (!props.dish.badge) return null
  return props.dish.badge[locale.value as 'es' | 'en'] ?? props.dish.badge.es
})

const showPrice = computed(
  () => props.modality === 'carta' && props.dish.price != null
)
const showIncluido = computed(
  () => props.modality === 'buffet' && props.dish.incluido
)
</script>

<template>
  <div class="flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm">
    <div
      v-if="dish.imageUrl"
      class="relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink bg-accent/20 p-4"
    >
      <NuxtImg
        class="block h-full w-full object-contain"
        style="aspect-ratio: auto"
        :src="dish.imageUrl"
        :alt="dishName"
        width="320"
        loading="lazy"
      />
      <span
        v-if="dishBadge"
        class="absolute right-2 top-2 rounded-pop-full border-pop-sm border-ink bg-pink px-2 py-0.5 font-disp font-extrabold uppercase text-kicker text-panel"
      >
        {{ dishBadge }}
      </span>
    </div>
    <h3 class="font-disp font-extrabold uppercase text-dish-title">{{ dishName }}</h3>
    <p class="text-soft text-body">{{ dishDesc }}</p>
    <div class="flex items-center gap-2">
      <span v-if="showIncluido" class="font-disp font-extrabold uppercase text-kicker text-accent">
        {{ t('menu.dish.incluido') }}
      </span>
      <span v-else-if="showPrice" class="font-disp font-extrabold text-dish-title">
        {{ t('menu.dish.price_prefix') }}{{ dish.price }}
      </span>
    </div>
    <MenuSaucePicker v-if="dish.requiresSauce" :sauces="sauces" />
  </div>
</template>
