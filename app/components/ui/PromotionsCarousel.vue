<script setup lang="ts">
import emblaCarouselVue from 'embla-carousel-vue'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Promotion } from '@/types/content'

const props = defineProps<{ promotions: Promotion[] }>()

const { t } = useI18n()

// Embla enhances the SSR-rendered slide track after hydration. `loop` is safe
// for a promotions carousel; drag/pointer nav is on by default.
const [emblaRef, emblaApi] = emblaCarouselVue({ loop: true, align: 'start' })

const selectedIndex = ref(0)
const scrollSnaps = ref<number[]>([])

/**
 * ID of the promo currently showing its back face (Terms & Conditions), if
 * any. Only one card is ever flipped at a time — owned here (not in
 * `PromotionCard`) so navigating away from a flipped slide can reset it in
 * one place (research.md R2).
 */
const flippedId = ref<string | null>(null)

/** Toggles the flip state for one promo; flipping another resets any other. */
function toggleFlip(id: string): void {
  flippedId.value = flippedId.value === id ? null : id
}

/** Navigation (dots/arrows) is only meaningful with more than one slide. */
const hasMultiple = computed(() => props.promotions.length > 1)

/**
 * Nav accent follows the ACTIVE slide's type (reactive to `selectedIndex`):
 *   ayce → orange, express → blue, all → orange→blue gradient.
 * Only the fill changes; the border-pop/ink outline + 44px tap targets stay.
 */
const activeType = computed(
  () => props.promotions[selectedIndex.value]?.type ?? 'all'
)
const navFillClass = computed(() => {
  switch (activeType.value) {
    case 'ayce':
      return 'bg-orange text-white'
    case 'express':
      return 'bg-blue text-white'
    default:
      return 'bg-gradient-to-r from-orange to-blue text-white'
  }
})
const activeDotClass = computed(() => {
  switch (activeType.value) {
    case 'ayce':
      return 'bg-orange'
    case 'express':
      return 'bg-blue'
    default:
      return 'bg-gradient-to-r from-orange to-blue'
  }
})

function onSelect(): void {
  const api = emblaApi.value
  if (!api) return
  selectedIndex.value = api.selectedScrollSnap()
  // Never leave a visitor stuck on a stale back face after navigating away
  // from that slide (FR-004) — drag, arrows, and dots all funnel through
  // Embla's `select`/`reInit` events, already wired to this handler.
  flippedId.value = null
}

function scrollTo(index: number): void {
  emblaApi.value?.scrollTo(index)
}

function scrollPrev(): void {
  emblaApi.value?.scrollPrev()
}

function scrollNext(): void {
  emblaApi.value?.scrollNext()
}

onMounted(() => {
  const api = emblaApi.value
  if (!api) return
  // Respect reduced motion: embla has no autoplay here, but disable its smooth
  // scroll duration so navigation is instant (no auto-advance motion).
  const reduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) {
    api.reInit({ duration: 0 })
  }
  scrollSnaps.value = api.scrollSnapList()
  onSelect()
  api.on('select', onSelect)
  api.on('reInit', onSelect)
})

onBeforeUnmount(() => {
  emblaApi.value?.off('select', onSelect)
})
</script>

<template>
  <section
    v-if="promotions.length > 0"
    class="relative"
    :aria-roledescription="t('promotions.carousel.label')"
    :aria-label="t('promotions.carousel.label')"
  >
    <!-- Embla viewport: ONE full-bleed slide per view at every breakpoint. Small
         rounded corners live on the container only; each promo IMAGE fills the
         whole slide width edge-to-edge. -->
    <div
      ref="emblaRef"
      class="overflow-hidden rounded-pop border-pop border-ink"
      data-testid="carousel-viewport"
    >
      <div class="flex touch-pan-y">
        <div
          v-for="promo in promotions"
          :key="promo.id"
          class="min-w-0 shrink-0 grow-0 basis-full"
          data-testid="carousel-slide"
        >
          <UiPromotionCard
            :promotion="promo"
            :flipped="promo.id === flippedId"
            @flip="toggleFlip(promo.id)"
          />
        </div>
      </div>
    </div>

    <!-- Prev / next arrows (multi-slide only). -->
    <div v-if="hasMultiple" class="mt-4 flex items-center justify-center gap-3">
      <button
        type="button"
        data-testid="carousel-prev"
        :aria-label="t('promotions.carousel.prev')"
        :class="[
          'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pop-full border-pop border-ink font-disp font-extrabold shadow-pop-sm transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-pop motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          navFillClass,
        ]"
        @click="scrollPrev"
      >
        ←
      </button>

      <!-- Dot indicators. -->
      <div class="flex items-center gap-2" data-testid="carousel-dots">
        <button
          v-for="(_, index) in scrollSnaps"
          :key="index"
          type="button"
          :aria-label="t('promotions.carousel.goToSlide', { n: index + 1 })"
          :aria-current="index === selectedIndex ? 'true' : undefined"
          :class="[
            'h-3 w-3 rounded-pop-full border-pop border-ink transition-colors',
            index === selectedIndex ? activeDotClass : 'bg-panel',
          ]"
          data-testid="carousel-dot"
          @click="scrollTo(index)"
        />
      </div>

      <button
        type="button"
        data-testid="carousel-next"
        :aria-label="t('promotions.carousel.next')"
        :class="[
          'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-pop-full border-pop border-ink font-disp font-extrabold shadow-pop-sm transition-transform duration-200 hover:-translate-y-[2px] hover:shadow-pop motion-reduce:transition-none motion-reduce:hover:translate-y-0',
          navFillClass,
        ]"
        @click="scrollNext"
      >
        →
      </button>
    </div>
  </section>
</template>
