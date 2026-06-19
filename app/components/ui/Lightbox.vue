<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

interface LightboxProps {
  open: boolean
  src: string | null
  alt?: string
}

const props = withDefaults(defineProps<LightboxProps>(), {
  alt: '',
})

const emit = defineEmits<{ close: [] }>()

const { t } = useI18n()

const closeButton = ref<HTMLButtonElement | null>(null)
let previouslyFocused: HTMLElement | null = null

function close(): void {
  emit('close')
}

function onBackdropPointer(event: MouseEvent): void {
  // Close only when the backdrop itself is the target, never the image.
  if (event.target === event.currentTarget) close()
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
  }
}

function lockScroll(lock: boolean): void {
  if (typeof document === 'undefined') return
  document.body.style.overflow = lock ? 'hidden' : ''
}

function teardown(): void {
  if (typeof document !== 'undefined') {
    document.removeEventListener('keydown', onKeydown)
  }
  lockScroll(false)
  previouslyFocused?.focus?.()
  previouslyFocused = null
}

watch(
  () => props.open && props.src !== null,
  async isActive => {
    if (typeof document === 'undefined') return
    if (isActive) {
      previouslyFocused = document.activeElement as HTMLElement | null
      document.addEventListener('keydown', onKeydown)
      lockScroll(true)
      await nextTick()
      closeButton.value?.focus()
    } else {
      teardown()
    }
  },
  { immediate: true }
)

onBeforeUnmount(teardown)
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open && src"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-ink/80 p-4 motion-safe:animate-none"
      role="dialog"
      aria-modal="true"
      :aria-label="alt || t('common.close')"
      @click="onBackdropPointer"
    >
      <button
        ref="closeButton"
        type="button"
        class="absolute right-4 top-4 z-[1] flex h-11 w-11 items-center justify-center rounded-pop-full border-pop border-ink bg-panel font-disp font-extrabold text-ink shadow-pop transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        :aria-label="t('common.close')"
        @click="close"
      >
        <span aria-hidden="true">✕</span>
      </button>
      <img
        :src="src"
        :alt="alt"
        class="max-h-[90vh] max-w-[90vw] rounded-pop border-pop border-ink bg-panel object-contain shadow-pop"
        decoding="async"
      />
    </div>
  </Teleport>
</template>
