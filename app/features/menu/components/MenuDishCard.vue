<script setup lang="ts">
import { computed } from 'vue'
import type { FullMenuDish, MenuModality } from '@/types/menu'

const props = defineProps<{
  dish: FullMenuDish
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
  <div class="relative flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm transition-transform duration-300 ease-out hover:z-10 hover:scale-105 motion-reduce:transform-none">
    <!-- "Garantía Sumo" star badge for featured (curated) dishes. Top-LEFT so it
         never overlaps the pink badgeEs sticker (which sits top-right inside the
         image). Shown regardless of whether the dish has an image. -->
    <img
      v-if="dish.featured"
      data-testid="guarantee-badge"
      class="absolute left-2 top-2 z-10 size-16"
      src="/brand/garantia-sumo.webp"
      :alt="t('menu.guarantee_alt')"
      loading="lazy"
      decoding="async"
    />
    <div
      v-if="dish.imageUrl"
      class="group relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink bg-accent/20 p-4"
    >
      <img
        class="block h-full w-full object-contain"
        :src="dish.imageUrl"
        :alt="dishName"
        loading="lazy"
        decoding="async"
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
  </div>
</template>
