<script setup lang="ts">
import { computed } from 'vue'

interface MarqueeProps {
  speed?: 'slow' | 'normal' | 'fast'
  direction?: 'left' | 'right'
  pauseOnHover?: boolean
}

const props = withDefaults(defineProps<MarqueeProps>(), {
  speed: 'normal',
  direction: 'left',
  pauseOnHover: true,
})

const trackStyle = computed(() => {
  const durations = { slow: '40s', normal: '20s', fast: '10s' } as const
  const directions = { left: 'normal', right: 'reverse' } as const
  return {
    animationDuration: durations[props.speed],
    animationDirection: directions[props.direction],
  }
})
</script>

<template>
  <div
    class="marquee w-full overflow-hidden border-y-pop border-ink bg-yellow text-ink"
    :class="{ 'pause-on-hover': pauseOnHover }"
  >
    <div class="marquee-track flex shrink-0 gap-8 py-3" :style="trackStyle">
      <div class="marquee-content flex shrink-0 items-center gap-8 px-4">
        <slot />
      </div>
      <div
        class="marquee-content flex shrink-0 items-center gap-8 px-4"
        aria-hidden="true"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<style scoped>
.marquee {
  --marquee-duration: 20s;
}

.marquee-track {
  animation: marquee var(--marquee-duration) linear infinite;
  width: max-content;
}

.pause-on-hover:hover .marquee-track {
  animation-play-state: paused;
}

@keyframes marquee {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
    transform: translateX(0);
  }
}
</style>
