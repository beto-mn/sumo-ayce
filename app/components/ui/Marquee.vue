<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

interface MarqueeProps {
  speed?: 'slow' | 'normal' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
  /** Color theme. `yellow` (default) keeps the legacy look; `ink` is a dark
   *  band with light text used for the global homepage marquee. */
  tone?: 'yellow' | 'ink'
}

const props = withDefaults(defineProps<MarqueeProps>(), {
  speed: 'normal',
  direction: 'left',
  pauseOnHover: true,
  tone: 'yellow',
})

const toneClasses = computed(() =>
  props.tone === 'ink' ? 'bg-ink text-bg' : 'bg-yellow text-ink'
)

/**
 * Number of slot copies rendered in the track. MUST stay even: the
 * `animate-marquee` keyframe scrolls `translateX(0 → -50%)`, so half the track
 * (N/2 copies) is what's revealed during one loop. For a seamless, gap-free
 * loop that visible half must be ≥ the container width at every viewport.
 *
 * SSR-safe default of 6 covers typical desktop widths so the server-rendered
 * band is already gap-free with no hydration mismatch; the precise value is
 * measured and applied after hydration (onMounted) and on resize.
 */
const copyCount = ref(6)

const rootRef = ref<HTMLElement | null>(null)
const groupRef = ref<HTMLElement | null>(null)
let observer: ResizeObserver | null = null

function measure() {
  const container = rootRef.value
  const group = groupRef.value
  if (!container || !group) return
  const containerWidth = container.clientWidth
  const groupWidth = group.scrollWidth
  if (containerWidth <= 0 || groupWidth <= 0) return
  // N even so -50% reveals exactly N/2 copies; N/2 copies ≥ container width.
  const next = Math.max(2, 2 * Math.ceil(containerWidth / groupWidth))
  if (next !== copyCount.value) copyCount.value = next
}

let rafId = 0
function scheduleMeasure() {
  if (rafId) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(measure)
}

onMounted(() => {
  measure()
  // Text width depends on the loaded display font; remeasure once fonts settle.
  document.fonts?.ready?.then(measure).catch(() => {})
  if (rootRef.value && typeof ResizeObserver !== 'undefined') {
    observer = new ResizeObserver(scheduleMeasure)
    observer.observe(rootRef.value)
  }
})

onBeforeUnmount(() => {
  if (rafId) cancelAnimationFrame(rafId)
  observer?.disconnect()
  observer = null
})

/**
 * Duration + direction are inline so they override the longhands of the
 * `animate-marquee` shorthand (inline styles beat stylesheet rules); the
 * keyframes, timing-function and iteration-count come from the Tailwind class.
 *
 * Base durations are tuned for the default 6-copy track (3 visible). The
 * duration scales with the visible half (N/2) so the on-screen scroll speed
 * stays roughly constant as copies are added on wider viewports.
 */
const trackStyle = computed(() => {
  const baseSeconds = { slow: 40, normal: 20, fast: 10 } as const
  const directions = { left: 'normal', right: 'reverse' } as const
  const baseVisible = 3
  const visible = copyCount.value / 2
  const seconds = (baseSeconds[props.speed] / baseVisible) * visible
  return {
    animationDuration: `${seconds}s`,
    animationDirection: directions[props.direction],
  }
})
</script>

<template>
  <div
    ref="rootRef"
    class="marquee w-full overflow-hidden border-y-pop border-ink [&_*]:[-webkit-text-fill-color:currentColor]"
    :class="[toneClasses, { 'pause-on-hover': pauseOnHover }]"
  >
    <!-- Track holds N even copies of the slot (w-max). `animate-marquee` scrolls
         -50%, revealing exactly N/2 copies, so the loop is seamless. N adapts to
         the container width (see copyCount) so the visible half is always ≥ the
         viewport and never gaps. `motion-reduce` keeps it static; hover-pause
         fires only on hover-capable pointers via `hoverOnlyWhenSupported`. -->
    <div
      class="marquee-track flex w-max shrink-0 gap-8 py-3 animate-marquee motion-reduce:animate-none"
      :class="{
        'hover:[animation-play-state:paused]': pauseOnHover,
      }"
      :style="trackStyle"
    >
      <div
        v-for="copy in copyCount"
        :key="copy"
        :ref="copy === 1 ? (el => { groupRef = el as HTMLElement }) : undefined"
        class="marquee-content flex shrink-0 items-center gap-8 px-4"
        :aria-hidden="copy === 1 ? undefined : 'true'"
      >
        <slot />
      </div>
    </div>
  </div>
</template>
