import type { Branch, ReservationDraft } from '../types'

interface FormErrors {
  branch?: string
  date?: string
  time?: string
  partySize?: string
  name?: string
  phone?: string
}

export function stripPhone(raw: string): string {
  // Remove formatting characters (spaces, dashes, dots, parentheses)
  let s = raw.replace(/[\s\-.()]/g, '')
  // Strip country code: +52 or 52
  s = s.replace(/^\+?52/, '')
  // Strip old Mexican dialing prefixes: 044 (mobile), 045 (mobile long distance), 01 (long distance)
  s = s.replace(/^(044|045|01)/, '')
  // Remove any remaining non-digits
  return s.replace(/\D/g, '')
}

function todayIso(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const

export function toMinutes(hhmm: string, isMidnightClose = false): number {
  const [h, m] = hhmm.split(':').map(Number)
  if (isMidnightClose && h === 0 && m === 0) return 1440
  return (h ?? 0) * 60 + (m ?? 0)
}

export function validateTime(
  time: string,
  branch: Branch | undefined,
  date: string
): string | undefined {
  if (!time) return 'reservation.error.time_required'
  if (!/^\d{2}:\d{2}$/.test(time)) return 'reservation.error.time_invalid'

  if (!branch?.schedule || !date) return undefined
  const key = DAY_KEYS[new Date(`${date}T00:00:00`).getDay()]
  const slot = key ? branch.schedule[key] : null
  if (!slot) return undefined

  const selected = toMinutes(time)
  const open = toMinutes(slot.open)
  const lastSlot = toMinutes(slot.close, true) - 30
  if (selected < open || selected > lastSlot)
    return 'reservation.error.time_out_of_range'
  return undefined
}

export function validate(
  draft: ReservationDraft,
  branches: Branch[]
): FormErrors {
  const errs: FormErrors = {}
  if (!draft.branchId) errs.branch = 'reservation.error.branch_required'

  const today = todayIso()
  if (!draft.date) {
    errs.date = 'reservation.error.date_required'
  } else if (draft.date < today) {
    errs.date = 'reservation.error.date_past'
  } else {
    const max = new Date()
    max.setDate(max.getDate() + 30)
    const maxIso = `${max.getFullYear()}-${String(max.getMonth() + 1).padStart(2, '0')}-${String(max.getDate()).padStart(2, '0')}`
    if (draft.date > maxIso) errs.date = 'reservation.error.date_too_far'
  }

  const branch = branches.find(b => b.id === draft.branchId)
  const timeErr = validateTime(draft.time, branch, draft.date)
  if (timeErr) errs.time = timeErr

  if (!draft.partySize || draft.partySize < 1 || draft.partySize > 20) {
    errs.partySize = 'reservation.error.party_size'
  }

  if (!draft.name.trim()) errs.name = 'reservation.error.name_required'

  const stripped = stripPhone(draft.phone)
  if (!/^\d{10}$/.test(stripped)) errs.phone = 'reservation.error.phone_invalid'

  return errs
}
