import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Branch } from '../types'
import { useReservationSubmit } from './useReservationSubmit'

// Stub $fetch globally so the composable can be tested without Nuxt
const mockFetch = vi.fn()
vi.stubGlobal('$fetch', mockFetch)

const BRANCHES: Branch[] = [
  {
    id: 'branch-uuid-1',
    name: 'SUMO Polanco',
    type: 'ayce',
    schedule: {
      mon: { open: '13:00', close: '22:00' },
      tue: { open: '13:00', close: '22:00' },
      wed: { open: '13:00', close: '22:00' },
      thu: { open: '13:00', close: '22:00' },
      fri: { open: '13:00', close: '22:00' },
      sat: { open: '13:00', close: '22:00' },
      sun: { open: '13:00', close: '22:00' },
    },
  },
]

function validDraft() {
  // future date 30 days out
  const future = new Date()
  future.setDate(future.getDate() + 5)
  const yyyy = future.getFullYear()
  const mm = String(future.getMonth() + 1).padStart(2, '0')
  const dd = String(future.getDate()).padStart(2, '0')
  return {
    branchId: 'branch-uuid-1',
    tipo: 'ayce' as const,
    date: `${yyyy}-${mm}-${dd}`,
    time: '14:00',
    partySize: 4,
    name: 'Juan Pérez',
    phone: '5512345678',
  }
}

describe('useReservationSubmit — validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('branchId null → error reservation.error.branch_required', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    const d = validDraft()
    draft.branchId = null
    draft.tipo = d.tipo
    draft.date = d.date
    draft.time = d.time
    draft.partySize = d.partySize
    draft.name = d.name
    draft.phone = d.phone
    await submit()
    expect(errors.branch).toBe('reservation.error.branch_required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('date empty → error reservation.error.date_required', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.date = ''
    await submit()
    expect(errors.date).toBe('reservation.error.date_required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('past date → error reservation.error.date_past', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.date = '2000-01-01'
    await submit()
    expect(errors.date).toBe('reservation.error.date_past')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('date more than 30 days ahead → error reservation.error.date_too_far', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    const far = new Date()
    far.setDate(far.getDate() + 31)
    draft.date = `${far.getFullYear()}-${String(far.getMonth() + 1).padStart(2, '0')}-${String(far.getDate()).padStart(2, '0')}`
    await submit()
    expect(errors.date).toBe('reservation.error.date_too_far')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('time empty → error reservation.error.time_required', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.time = ''
    await submit()
    expect(errors.time).toBe('reservation.error.time_required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('partySize 0 → error reservation.error.party_size', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.partySize = 0
    await submit()
    expect(errors.partySize).toBe('reservation.error.party_size')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('partySize null → error reservation.error.party_size', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.partySize = null
    await submit()
    expect(errors.partySize).toBe('reservation.error.party_size')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('partySize > 20 → error reservation.error.party_size', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.partySize = 21
    await submit()
    expect(errors.partySize).toBe('reservation.error.party_size')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('name empty → error reservation.error.name_required', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.name = ''
    await submit()
    expect(errors.name).toBe('reservation.error.name_required')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('phone invalid (non-10-digit) → error reservation.error.phone_invalid', async () => {
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '12345'
    await submit()
    expect(errors.phone).toBe('reservation.error.phone_invalid')
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('+52 prefix stripped: +525512345678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '+525512345678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('52 prefix without + stripped: 525512345678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '525512345678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('spaces and dashes stripped: 55 1234-5678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '55 1234-5678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('parentheses format stripped: (55) 1234-5678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '(55) 1234-5678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('044 prefix stripped: 044 55 1234 5678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '044 5512345678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('01 lada prefix stripped: 01 55 1234 5678 → valid', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '01 5512345678'
    await submit()
    expect(errors.phone).toBeUndefined()
  })

  it('all fields valid → no errors and $fetch called', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, errors, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(errors.branch).toBeUndefined()
    expect(errors.date).toBeUndefined()
    expect(errors.time).toBeUndefined()
    expect(errors.partySize).toBeUndefined()
    expect(errors.name).toBeUndefined()
    expect(errors.phone).toBeUndefined()
    expect(mockFetch).toHaveBeenCalledOnce()
  })
})

describe('useReservationSubmit — API success', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('API 201 → confirmationData set with folio', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-1234' } })
    const { draft, status, confirmationData, submit } =
      useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(status.value).toBe('success')
    expect(confirmationData.value?.folio).toBe('SUMO-1234')
  })

  it('API success → confirmationData includes branchName resolved from branch list', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-9999' } })
    const { draft, confirmationData, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(confirmationData.value?.branchName).toBe('SUMO Polanco')
  })

  it('payload sent to $fetch has stripped 10-digit contactPhone', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    draft.phone = '+525599887766'
    await submit()
    const payload = mockFetch.mock.calls[0]?.[1]?.body
    expect(payload?.contactPhone).toBe('5599887766')
  })
})

describe('useReservationSubmit — API error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('API 4xx/5xx → status = error, fields re-enabled', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Internal Server Error'))
    const { draft, status, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(status.value).toBe('error')
  })

  it('network failure → status = error', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    const { draft, status, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(status.value).toBe('error')
  })

  it('API error → apiError set with generic message key', async () => {
    mockFetch.mockRejectedValueOnce(new Error('500'))
    const { draft, apiError, submit } = useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(apiError.value).toBe('reservation.error.api_generic')
  })

  it('field edit after error → apiError cleared', async () => {
    mockFetch.mockRejectedValueOnce(new Error('500'))
    const { draft, apiError, submit, clearErrorOnEdit } =
      useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(apiError.value).toBeTruthy()
    clearErrorOnEdit()
    expect(apiError.value).toBeNull()
  })
})

describe('useReservationSubmit — resetForm', () => {
  it('resets draft and status to initial values', async () => {
    mockFetch.mockResolvedValueOnce({ data: { folio: 'SUMO-0001' } })
    const { draft, status, confirmationData, submit, resetForm } =
      useReservationSubmit(BRANCHES)
    Object.assign(draft, validDraft())
    await submit()
    expect(status.value).toBe('success')
    resetForm()
    expect(status.value).toBe('idle')
    expect(confirmationData.value).toBeNull()
    expect(draft.branchId).toBeNull()
    expect(draft.name).toBe('')
  })
})
