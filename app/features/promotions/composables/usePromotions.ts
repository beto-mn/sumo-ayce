import { ref } from 'vue'
import type { LightboxState } from '../types'

/**
 * Manages the lightbox state for the Promotions page.
 * Tracks which promotion flyer is currently open in the lightbox overlay.
 */
export function usePromotions() {
  const lightboxState = ref<LightboxState>({ open: false, imageUrl: null })

  function openLightbox(imageUrl: string): void {
    lightboxState.value = { open: true, imageUrl }
  }

  function closeLightbox(): void {
    lightboxState.value = { open: false, imageUrl: null }
  }

  return { lightboxState, openLightbox, closeLightbox }
}
