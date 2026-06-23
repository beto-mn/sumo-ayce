<script setup lang="ts">
import { computed } from 'vue'
import type { Promotion } from '@/types/content'
import { pickLocale } from '@/utils/bilingual'

const props = defineProps<{ promotion: Promotion }>()

const emit = defineEmits<{ 'open-lightbox': [imageUrl: string] }>()

const { locale, t } = useI18n()

/** Type badge text + tone driven by `acf.tipo`. `null` = no badge (tipo=all). */
const typeBadge = computed<{ label: string; tone: 'blue' | 'orange' } | null>(
  () => {
    if (props.promotion.type === 'express')
      return { label: t('promotions.typeBadge.express'), tone: 'blue' }
    if (props.promotion.type === 'ayce')
      return { label: t('promotions.typeBadge.ayce'), tone: 'orange' }
    return null
  }
)

/**
 * Badge tone from `acf.color`, falling back to orange.
 */
type StickerTone = 'orange' | 'pink' | 'yellow' | 'blue' | 'green'
const badgeTone = computed<StickerTone>(() => {
  const map: Record<string, StickerTone> = {
    orange: 'orange',
    pink: 'pink',
    yellow: 'yellow',
    blue: 'blue',
    green: 'green',
  }
  return map[props.promotion.color] ?? 'orange'
})

const isInteractive = computed(() => props.promotion.imageUrl !== null)

const title = computed(() => pickLocale(props.promotion.title, locale.value))
const badge = computed(() => pickLocale(props.promotion.badge, locale.value))
const description = computed(() =>
  pickLocale(props.promotion.description, locale.value)
)
const validity = computed(() =>
  pickLocale(props.promotion.validity, locale.value)
)

const openLabel = computed(() => t('home.promotions.openLabel'))

function handleOpen(): void {
  if (props.promotion.imageUrl === null) return
  emit('open-lightbox', props.promotion.imageUrl)
}
</script>

<template>
  <article
    data-testid="promotion-card"
    :class="[
      'relative flex flex-col gap-3 overflow-visible rounded-pop border-pop border-ink bg-panel pt-10 px-6 pb-6 text-ink shadow-pop',
      promotion.type === 'express' && 'scope-express',
      isInteractive
        ? 'cursor-pointer transition-transform hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
        : 'cursor-default',
    ]"
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    :aria-label="isInteractive ? `${openLabel}: ${title}` : undefined"
    @click="isInteractive && handleOpen()"
    @keydown.enter="isInteractive && handleOpen()"
  >
    <!-- Editor-controlled badge (acf.color), top-right, rotated -->
    <UiSticker
      class="absolute -top-3 -right-2 z-10"
      :tone="badgeTone"
      :rotate="-6"
    >
      {{ badge }}
    </UiSticker>

    <!-- Type badge (acf.tipo): shown for express/ayce, hidden for all -->
    <UiKicker
      v-if="typeBadge"
      data-testid="type-badge"
      class="self-start border-pop border-ink"
      :tone="typeBadge.tone"
      :rotate="0"
    >
      {{ typeBadge.label }}
    </UiKicker>

    <h3
      class="font-disp font-extrabold uppercase text-promo-title [overflow-wrap:anywhere]"
    >
      {{ title }}
    </h3>
    <p class="text-soft">{{ description }}</p>
    <p class="font-disp font-extrabold uppercase text-kicker text-ink">
      {{ validity }}
    </p>
    <p
      v-if="isInteractive"
      class="mt-auto font-disp font-extrabold uppercase text-kicker text-soft"
      aria-hidden="true"
    >
      {{ openLabel }} →
    </p>
  </article>
</template>
