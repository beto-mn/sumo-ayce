import type { Ref } from 'vue'

interface UseReservationModalReturn {
  isOpen: Ref<boolean>
  openReservation: () => void
  closeReservation: () => void
}

/**
 * Cross-feature open-reservation trigger (Article I — lives in app/composables,
 * NOT inside a feature folder). Backed by `useState` so it is SSR-safe and
 * shared app-wide. Calling `openReservation()` while no modal is mounted
 * (feature 014 not yet built) is no-op-safe: it only flips shared state that a
 * future reservation modal will subscribe to.
 */
export function useReservationModal(): UseReservationModalReturn {
  const isOpen = useState<boolean>('reservation-modal-open', () => false)
  return {
    isOpen,
    openReservation: () => {
      isOpen.value = true
    },
    closeReservation: () => {
      isOpen.value = false
    },
  }
}
