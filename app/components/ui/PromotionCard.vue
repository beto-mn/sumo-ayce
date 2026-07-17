<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Promotion } from '@/types/content'

const props = defineProps<{
  promotion: Promotion
  /** Whether this card currently shows its back face (owned by the carousel). */
  flipped?: boolean
}>()

const emit = defineEmits<{ flip: [] }>()

const { t, locale } = useI18n()

/**
 * The flip affordance is offered ONLY when Terms & Conditions exist in BOTH
 * languages (bilingual-completeness rule, FR-008) — `promotion.terms` is
 * already normalized to `null` for any partial/absent pair upstream
 * (`parsePromotions`/`mapPromotion`), so this single check is sufficient.
 */
const hasTerms = computed(() => props.promotion.terms !== null)

/** Locale-aware terms text; empty string when there are no terms (never rendered then). */
const termsText = computed(() => {
  const terms = props.promotion.terms
  if (!terms) return ''
  return locale.value === 'en' ? terms.en : terms.es
})

/** Clicking anywhere on the card toggles the flip — but only when there ARE terms to show. */
function onCardClick(): void {
  if (hasTerms.value) emit('flip')
}

/**
 * Reduced-motion swaps the 3D rotate for an opacity cross-fade (research.md
 * R3) — same `matchMedia` detection already used in `PromotionsCarousel.vue`.
 */
const reducedMotion = ref(false)
onMounted(() => {
  reducedMotion.value = Boolean(
    typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  )
})

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
      hasTerms && 'cursor-pointer',
    ]"
    :aria-label="hasTerms ? t('promotions.terms.cardLabel') : undefined"
    @click="onCardClick"
  >
    <!-- Perspective wrapper: harmless when reduced-motion swaps to a cross-fade. -->
    <div class="relative [perspective:1200px]">
      <div
        data-testid="promotion-flip-inner"
        class="relative"
        :class="[
          reducedMotion
            ? ''
            : 'transition-transform duration-500 [-webkit-transform-style:preserve-3d] [transform-style:preserve-3d] motion-reduce:transition-none',
          !reducedMotion && flipped
            ? '[-webkit-transform:rotateY(180deg)] [transform:rotateY(180deg)]'
            : '',
        ]"
      >
        <!-- FRONT FACE: image, type pill, color badge. -->
        <div
          data-testid="promotion-front"
          :class="[
            !reducedMotion &&
              '[-webkit-backface-visibility:hidden] [backface-visibility:hidden]',
            reducedMotion ? 'transition-opacity duration-300' : '',
            reducedMotion && flipped ? 'pointer-events-none opacity-0' : '',
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

          <!-- Type pill (branch scope), top-left. Removed from the DOM while
               flipped instead of CSS-hidden — Safari doesn't reliably apply
               backface-visibility to absolutely-positioned+transformed
               descendants under preserve-3d. Reduced-motion keeps it in the
               DOM since that path cross-fades opacity instead of rotating. -->
          <span
            v-if="reducedMotion || !flipped"
            data-testid="promotion-type"
            :data-type="promotion.type"
            :class="[
              'absolute top-3 left-3 z-10 inline-flex items-center rounded-pop-full border-pop-sm border-ink px-3 py-1 font-disp text-kicker font-extrabold uppercase',
              typePillClass,
            ]"
          >
            {{ typeLabel }}
          </span>

          <!-- Color badge overlay (acf.color), top-right — same DOM-removal fix as the type pill above. -->
          <UiSticker
            v-if="reducedMotion || !flipped"
            data-testid="promotion-badge"
            class="absolute top-3 right-3 z-10"
            :tone="badgeTone"
            :rotate="-6"
          >
            {{ badgeLabel }}
          </UiSticker>
        </div>

        <!-- BACK FACE: Terms & Conditions. Overflow/scroll lives on the inner
             `promotion-back-content` div, not this transformed element — Safari
             breaks backface-visibility hiding when overflow-y is on the same
             element as a 3D transform. -->
        <div
          v-if="hasTerms"
          data-testid="promotion-back"
          class="absolute inset-0 rounded-pop border-pop border-ink bg-panel p-6 shadow-pop-sm min-[520px]:p-9 min-[880px]:p-12"
          :class="[
            !reducedMotion &&
              '[-webkit-backface-visibility:hidden] [backface-visibility:hidden] [-webkit-transform:rotateY(180deg)] [transform:rotateY(180deg)]',
            reducedMotion ? 'transition-opacity duration-300' : '',
            reducedMotion
              ? flipped
                ? 'opacity-100'
                : 'pointer-events-none opacity-0'
              : !flipped
                ? 'pointer-events-none'
                : '',
          ]"
        >
          <div
            data-testid="promotion-back-content"
            class="flex h-full w-full flex-col gap-3 overflow-y-auto"
          >
            <h3 class="font-disp font-extrabold uppercase text-dish-title">
              {{ t('promotions.terms.heading') }}
            </h3>
            <p class="whitespace-pre-line text-body text-ink">
              {{ termsText }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>
