import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Minimal useState shim backed by a module-scoped store, mirroring Nuxt's
// shared SSR-safe state semantics for the unit test.
const store = new Map<string, ReturnType<typeof ref>>()
vi.stubGlobal('useState', (key: string, init: () => unknown) => {
  if (!store.has(key)) store.set(key, ref(init()))
  return store.get(key)
})

describe('useReservationModal', () => {
  beforeEach(() => {
    store.clear()
  })

  it('starts closed', async () => {
    const { useReservationModal } = await import('./useReservationModal')
    const { isOpen } = useReservationModal()
    expect(isOpen.value).toBe(false)
  })

  it('openReservation() sets isOpen true and is no-op-safe with no consumer', async () => {
    const { useReservationModal } = await import('./useReservationModal')
    const { isOpen, openReservation } = useReservationModal()
    expect(() => openReservation()).not.toThrow()
    expect(isOpen.value).toBe(true)
  })

  it('closeReservation() sets isOpen false', async () => {
    const { useReservationModal } = await import('./useReservationModal')
    const { isOpen, openReservation, closeReservation } = useReservationModal()
    openReservation()
    closeReservation()
    expect(isOpen.value).toBe(false)
  })

  it('shares state across calls (same useState key)', async () => {
    const { useReservationModal } = await import('./useReservationModal')
    useReservationModal().openReservation()
    expect(useReservationModal().isOpen.value).toBe(true)
  })
})
