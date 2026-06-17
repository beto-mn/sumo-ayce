<script setup lang="ts">
import { computed, ref } from 'vue'
import { cx } from '@/utils/cx'

interface NavProps {
  accent?: 'ayce' | 'express'
  sticky?: boolean
}

const props = withDefaults(defineProps<NavProps>(), {
  accent: 'ayce',
  sticky: true,
})

const open = ref(false)

function toggleMenu() {
  open.value = !open.value
}

const rootClasses = computed(() =>
  cx(
    'w-full bg-bg border-b-pop border-ink z-50',
    props.sticky && 'sticky top-0',
    props.accent === 'express' && 'scope-express'
  )
)
</script>

<template>
  <nav :class="rootClasses" data-component="Nav">
    <div
      class="container-pop flex items-center justify-between gap-4 py-3"
    >
      <!-- Logo: SUMO logo used UNMODIFIED (square, orange bg, white SUMO, black bar) -->
      <slot name="logo">
        <a
          href="/"
          class="inline-flex flex-col items-center justify-center rounded-pop-sm border-pop border-ink bg-orange p-1 shadow-pop-sm"
          aria-label="SUMO — All You Can Eat"
          data-logo="sumo"
        >
          <span
            class="font-disp font-extrabold uppercase text-bg leading-none text-2xl tracking-tight px-2 pt-1"
            >SUMO</span
          >
          <span
            class="mt-1 w-full bg-ink text-bg font-disp font-extrabold uppercase text-micro tracking-widest text-center py-0.5 px-1"
            >ALL YOU CAN EAT</span
          >
        </a>
      </slot>

      <!-- Center links -->
      <div class="hidden md:flex items-center gap-2">
        <slot name="links" />
      </div>

      <!-- Right-hand actions -->
      <div class="flex items-center gap-2">
        <slot name="actions" />
        <button
          type="button"
          class="md:hidden inline-flex h-11 w-11 items-center justify-center rounded-pop-sm border-pop border-ink bg-yellow text-ink shadow-pop-sm font-disp"
          :aria-expanded="open"
          aria-label="Abrir menú"
          @click="toggleMenu"
        >
          <span aria-hidden="true">{{ open ? '✕' : '☰' }}</span>
        </button>
      </div>
    </div>

    <!-- Mobile collapsed overlay -->
    <div
      v-if="open"
      class="md:hidden border-t-pop border-ink bg-bg px-4 py-4 flex flex-col gap-3"
    >
      <slot name="links" />
    </div>
  </nav>
</template>
