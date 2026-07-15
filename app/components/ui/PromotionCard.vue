<script setup lang="ts">
import { computed } from 'vue'
import type { Promotion } from '@/types/content'

const props = defineProps<{ promotion: Promotion }>()

const { t, locale } = useI18n()

/**
 * Badge tone from `acf.color`, falling back to orange. Drives the UiSticker
 * accent so unknown colors never leak an invalid tone.
 */
type StickerTone = 'orange' | 'pink' | 'yellow' | 'blue' | 'green'
const badgeTone = computed<StickerTone>(() => {
  const tones: Record<StickerTone, true> = {
    orange: true,
    pink: true,
    yellow: true,
    blue: true,
    green: true,
  }
  return props.promotion.color in tones
    ? (props.promotion.color as StickerTone)
    : 'orange'
})

/**
 * Type pill (top-left): labels the promo's branch scope AND color-codes it.
 * AYCE → orange, Express → blue, Ambos ('all') → orange→blue gradient. The
 * text label keeps it accessible (never color-only).
 */
const typeLabel = computed(() => t(`promotions.type.${props.promotion.type}`))
const typePillClass = computed(() => {
  switch (props.promotion.type) {
    case 'express':
      return 'bg-blue text-white'
    case 'all':
      return 'bg-gradient-to-r from-orange to-blue text-white'
    default:
      return 'bg-orange text-white'
  }
})

/** Locale-aware badge label sourced from WordPress. */
const badgeLabel = computed(() =>
  locale.value === 'en' && props.promotion.badge.en
    ? props.promotion.badge.en
    : props.promotion.badge.es
)

/** Accessible image label = decoded title, with a generic fallback when empty. */
const imageAlt = computed(() =>
  props.promotion.title.trim() !== ''
    ? props.promotion.title
    : t('promotions.imageAltFallback')
)

const hasImage = computed(() => props.promotion.imageDesktopUrl !== null)

/** Desktop image is the baseline `<img>` src and the fallback for all sizes. */
const desktopSrc = computed(() => props.promotion.imageDesktopUrl ?? '')
const tabletSrc = computed(
  () => props.promotion.imageTabletUrl ?? props.promotion.imageDesktopUrl ?? ''
)
const movilSrc = computed(
  () => props.promotion.imageMovilUrl ?? props.promotion.imageDesktopUrl ?? ''
)
</script>

<template>
  <article
    data-testid="promotion-card"
    :class="[
      'relative isolate block w-full',
      promotion.type === 'express' && 'scope-express',
    ]"
  >
    <!-- The promo IMAGE *is* the slide — no card frame/letterbox. Full-bleed,
         natural aspect. Responsive <picture>: mobile ≤520, tablet ≤880, desktop
         baseline. -->
    <picture v-if="hasImage" data-testid="promotion-picture" class="block">
      <source :srcset="movilSrc" media="(max-width: 520px)" />
      <source :srcset="tabletSrc" media="(max-width: 880px)" />
      <img
        data-testid="promotion-img"
        :src="desktopSrc"
        :alt="imageAlt"
        class="block h-auto w-full"
        loading="lazy"
        decoding="async"
      />
    </picture>

    <!-- No-image fallback keeps the slide from collapsing / showing a broken img. -->
    <div
      v-else
      data-testid="promotion-noimage"
      class="flex aspect-video w-full items-center justify-center bg-bg2 font-disp font-extrabold uppercase text-soft"
    >
      {{ imageAlt }}
    </div>

    <!-- Type pill (branch scope), top-left. Color-coded + labeled for a11y. -->
    <span
      data-testid="promotion-type"
      :data-type="promotion.type"
      :class="[
        'absolute top-3 left-3 z-10 inline-flex items-center rounded-pop-full border-pop-sm border-ink px-3 py-1 font-disp text-kicker font-extrabold uppercase',
        typePillClass,
      ]"
    >
      {{ typeLabel }}
    </span>

    <!-- Color badge overlay (acf.color), top-right. -->
    <UiSticker
      data-testid="promotion-badge"
      class="absolute top-3 right-3 z-10"
      :tone="badgeTone"
      :rotate="-6"
    >
      {{ badgeLabel }}
    </UiSticker>
  </article>
</template>
