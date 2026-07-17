<script setup lang="ts">
import { computed } from 'vue'
import type { PickerOption } from '@/features/menu/types'
import type { FullMenuDish, MenuModality } from '@/types/menu'

const props = defineProps<{
  dish: FullMenuDish
  modality: MenuModality
  /**
   * Swaps the image panel's background for the orange→blue gradient instead
   * of the plain default (Part D — "All You Can Eat Kids" only). Same
   * gradient utility already used by `PromotionsCarousel.vue`'s "Ambos" nav
   * fill, reused here for token consistency (no new color introduced).
   */
  highlightBackground?: boolean
}>()

const { t, locale } = useI18n()

/**
 * One `MenuSaucePicker` per DB-configured option group (Part C — "build your
 * own" Ramen XL, and any future dish with option groups configured; `[]` for
 * the overwhelming majority of dishes). `MenuSaucePicker.vue` itself is
 * unchanged — already a generic `PickerOption[]`-driven picker (research.md
 * R6a) — so this is purely a mapping, no new UI component.
 */
function groupChoices(
  group: FullMenuDish['optionGroups'][number]
): PickerOption[] {
  return group.choices.map(choice => ({
    id: choice.id,
    label: choice.name[locale.value as 'es' | 'en'] ?? choice.name.es,
  }))
}
function groupLabel(group: FullMenuDish['optionGroups'][number]): string {
  return group.name[locale.value as 'es' | 'en'] ?? group.name.es
}

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
      class="absolute left-2 top-2 z-10 size-24"
      src="/brand/garantia-sumo.webp"
      :alt="t('menu.guarantee_alt')"
      loading="lazy"
      decoding="async"
    />
    <div
      v-if="dish.imageUrl"
      data-testid="dish-image-panel"
      :class="[
        'group relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink p-4',
        highlightBackground ? 'bg-gradient-to-r from-orange to-blue' : 'bg-accent/20',
      ]"
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
    <!-- DB-driven "build your own" option groups (Part C) — one picker per
         configured group, e.g. Ramen XL's "Base de fideo" / "Proteína" /
         "Añade extra proteína". Empty for every dish with no groups. -->
    <MenuSaucePicker
      v-for="group in dish.optionGroups"
      :key="group.key"
      :options="groupChoices(group)"
      :picker-label="groupLabel(group)"
    />
  </div>
</template>
