import type { ComputedRef, Ref } from 'vue'
import { computed } from 'vue'
import type { Branch } from '../types'

function toMinutes(hhmm: string, isMidnightClose = false): number {
  const [h, m] = hhmm.split(':').map(Number)
  if (isMidnightClose && h === 0 && m === 0) return 1440
  return (h ?? 0) * 60 + (m ?? 0)
}

/**
 * Generates 15-minute time slot strings for a given branch schedule and date.
 *
 * @param open  - Opening time "HH:MM" (inclusive)
 * @param close - Closing time "HH:MM" (exclusive; last slot = close - 30 min)
 * @param date  - ISO date string "YYYY-MM-DD" (client timezone)
 * @returns     Array of "HH:MM" strings, filtered for past times if date is today
 */
export function generateSlots(
  open: string,
  close: string,
  date: string
): string[] {
  if (!open || !close) return []

  const openMin = toMinutes(open)
  const closeMin = toMinutes(close, true)
  const lastSlotMin = closeMin - 30

  if (openMin > lastSlotMin) return []

  const now = new Date()
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const isToday = date === todayIso
  const currentMin = now.getHours() * 60 + now.getMinutes()

  const slots: string[] = []
  for (let min = openMin; min <= lastSlotMin; min += 15) {
    if (isToday && min <= currentMin) continue
    const h = Math.floor(min / 60)
    const m = min % 60
    slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return slots
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
type DayKey = (typeof DAY_KEYS)[number]

function resolveScheduleSlot(
  branch: Branch,
  date: string
): { open: string; close: string } | null {
  if (!branch.schedule) return null
  const d = new Date(`${date}T00:00:00`)
  const key = DAY_KEYS[d.getDay()] as DayKey
  return branch.schedule[key] ?? null
}

interface UseReservationSlotsReturn {
  slots: ComputedRef<string[]>
}

export function useReservationSlots(
  branch: Ref<Branch | null>,
  date: Ref<string>
): UseReservationSlotsReturn {
  const slots = computed<string[]>(() => {
    if (!branch.value || !date.value) return []
    const slot = resolveScheduleSlot(branch.value, date.value)
    if (!slot) return []
    return generateSlots(slot.open, slot.close, date.value)
  })

  return { slots }
}
