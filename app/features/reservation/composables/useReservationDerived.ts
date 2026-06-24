import { computed } from 'vue'
import type {
  Branch,
  BranchSchedule,
  BranchScheduleSlot,
  ReservationDraft,
} from '../types'

const DAY_KEYS: (keyof BranchSchedule)[] = [
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
]

export function useReservationDerived(
  draft: ReservationDraft,
  branches: Branch[]
) {
  const selectedBranch = computed<Branch | null>(
    () => branches.find(b => b.id === draft.branchId) ?? null
  )

  const scheduleForDate = computed<BranchScheduleSlot | null>(() => {
    if (!selectedBranch.value?.schedule || !draft.date) return null
    const key = DAY_KEYS[new Date(`${draft.date}T00:00:00`).getDay()]
    return key ? (selectedBranch.value.schedule[key] ?? null) : null
  })

  const horaMin = computed(() => scheduleForDate.value?.open ?? '')

  const horaMax = computed(() => {
    const close = scheduleForDate.value?.close
    if (!close) return ''
    const [h, m] = close.split(':').map(Number)
    const closeMin = h === 0 && m === 0 ? 1440 : (h ?? 0) * 60 + (m ?? 0)
    const totalMin = closeMin - 30
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`
  })

  const todayIso = computed(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })

  const maxDateIso = computed(() => {
    const max = new Date()
    max.setDate(max.getDate() + 30)
    return `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-${String(max.getDate()).padStart(2, '0')}`
  })

  const branchOptions = computed(() =>
    branches
      .filter(b => b.type === draft.tipo)
      .map(b => ({ value: b.id, label: b.name }))
  )

  const accentStyle = computed(() => ({
    '--accent': draft.tipo === 'express' ? 'var(--blue)' : 'var(--orange)',
  }))

  return {
    scheduleForDate,
    horaMin,
    horaMax,
    todayIso,
    maxDateIso,
    branchOptions,
    accentStyle,
  }
}
