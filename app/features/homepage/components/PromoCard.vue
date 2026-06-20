<script setup lang="ts">
import { computed } from 'vue'
import { pickLocale } from '@/features/homepage/utils/bilingual'
import type { Promotion } from '@/types/content'

const props = defineProps<{ promo: Promotion }>()

const emit = defineEmits<{ open: [{ src: string; alt: string }] }>()

const { t, locale } = useI18n()

const accent = computed<'ayce' | 'express'>(() =>
  props.promo.type === 'express' ? 'express' : 'ayce'
)

// The badge color is editor-controlled via `acf.color`. Map it 1:1 to a Sticker
// tone, falling back to `orange` for any unexpected value.
type StickerTone = 'orange' | 'pink' | 'yellow' | 'blue' | 'green'
const badgeTone = computed<StickerTone>(() => {
  const map: Record<string, StickerTone> = {
    orange: 'orange',
    pink: 'pink',
    yellow: 'yellow',
    blue: 'blue',
    green: 'green',
  }
  return map[props.promo.color] ?? 'orange'
})

// A small decorative type-indicator bar, driven by `acf.tipo` (NOT the badge
// color): blue for Express, orange for AYCE, and ink for `all` (neutral, since
// it applies to all lines). Every card shows a bar for visual consistency; any
// unexpected value falls back to ink too. Distinct from the editor-controlled
// `acf.color` badge above.
const typeBarClass = computed<'bg-blue' | 'bg-orange' | 'bg-ink'>(() => {
  if (props.promo.type === 'express') return 'bg-blue'
  if (props.promo.type === 'ayce') return 'bg-orange'
  return 'bg-ink'
})

const title = computed(() => pickLocale(props.promo.title, locale.value))
const badge = computed(() => pickLocale(props.promo.badge, locale.value))
const description = computed(() =>
  pickLocale(props.promo.description, locale.value)
)
const validity = computed(() => pickLocale(props.promo.validity, locale.value))

const isInteractive = computed(() => props.promo.imageUrl !== null)

const openLabel = computed(() => t('home.promotions.openLabel'))

function open(): void {
  if (props.promo.imageUrl === null) return
  emit('open', { src: props.promo.imageUrl, alt: title.value })
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    open()
  }
}
</script>

<template>
  <UiCard
    :accent="accent"
    class="promo-card relative flex flex-col gap-3 overflow-visible"
    :class="
      isInteractive &&
      'cursor-pointer transition-transform hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0'
    "
    :role="isInteractive ? 'button' : undefined"
    :tabindex="isInteractive ? 0 : undefined"
    :aria-label="isInteractive ? `${openLabel}: ${title}` : undefined"
    @click="isInteractive && open()"
    @keydown="isInteractive && onKeydown($event)"
  >
    <!-- Editor-controlled badge (acf.color), top-right, rotated, overlapping the
         card corner per the reference design. -->
    <UiSticker
      class="absolute -top-3 -right-2 z-10"
      :tone="badgeTone"
      :rotate="-6"
    >
      {{ badge }}
    </UiSticker>
    <!-- Type-indicator accent bar (acf.tipo): blue=Express, orange=AYCE,
         ink=all. Always rendered for visual consistency. Purely decorative. -->
    <div
      class="h-1.5 w-12 rounded-full"
      :class="typeBarClass"
      aria-hidden="true"
    />
    <h3
      class="font-disp font-extrabold uppercase text-promo-title [overflow-wrap:anywhere]"
    >
      {{ title }}
    </h3>
    <p class="text-soft">{{ description }}</p>
    <!-- Validity in neutral text per the reference (not accent-colored). -->
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
  </UiCard>
</template>
