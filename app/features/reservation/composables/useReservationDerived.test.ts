import { describe, expect, it } from 'vitest'
import { reactive } from 'vue'
import type { Branch, ReservationDraft } from '../types'
import { useReservationDerived } from './useReservationDerived'

const AYCE_BRANCH: Branch = {
  id: 'branch-ayce-1',
  name: 'SUMO Polanco',
  type: 'ayce',
  schedule: {
    mon: { open: '13:00', close: '22:00' },
    tue: { open: '13:00', close: '22:00' },
    wed: { open: '13:00', close: '22:00' },
    // 2099-12-31 is a Thursday
    thu: { open: '14:00', close: '23:00' },
    fri: { open: '13:00', close: '22:00' },
    sat: { open: '11:00', close: '23:00' },
    sun: { open: '11:00', close: '23:00' },
  },
}

const EXPRESS_BRANCH: Branch = {
  id: 'branch-express-1',
  name: 'SUMO Express Buenavista',
  type: 'express',
  schedule: {
    mon: { open: '12:00', close: '20:00' },
    tue: { open: '12:00', close: '20:00' },
    wed: { open: '12:00', close: '20:00' },
    thu: { open: '12:00', close: '20:00' },
    fri: { open: '12:00', close: '20:00' },
    sat: null,
    sun: null,
  },
}

const BRANCHES: Branch[] = [AYCE_BRANCH, EXPRESS_BRANCH]

function makeDraft(
  overrides: Partial<ReservationDraft> = {}
): ReservationDraft {
  return reactive<ReservationDraft>({
    branchId: null,
    tipo: 'ayce',
    date: '',
    time: '',
    partySize: null,
    name: '',
    phone: '',
    ...overrides,
  })
}

describe('useReservationDerived — branchOptions', () => {
  it('returns only ayce branches when draft.tipo is "ayce"', () => {
    const draft = makeDraft({ tipo: 'ayce' })
    const { branchOptions } = useReservationDerived(draft, BRANCHES)
    expect(branchOptions.value).toHaveLength(1)
    expect(branchOptions.value[0]).toEqual({
      value: 'branch-ayce-1',
      label: 'SUMO Polanco',
    })
  })

  it('returns only express branches when draft.tipo is "express"', () => {
    const draft = makeDraft({ tipo: 'express' })
    const { branchOptions } = useReservationDerived(draft, BRANCHES)
    expect(branchOptions.value).toHaveLength(1)
    expect(branchOptions.value[0]).toEqual({
      value: 'branch-express-1',
      label: 'SUMO Express Buenavista',
    })
  })

  it('returns empty array when no branches match the tipo', () => {
    const draft = makeDraft({ tipo: 'express' })
    const { branchOptions } = useReservationDerived(draft, [AYCE_BRANCH])
    expect(branchOptions.value).toHaveLength(0)
  })
})

describe('useReservationDerived — accentStyle', () => {
  it('returns var(--orange) accent for tipo "ayce"', () => {
    const draft = makeDraft({ tipo: 'ayce' })
    const { accentStyle } = useReservationDerived(draft, BRANCHES)
    expect(accentStyle.value).toEqual({ '--accent': 'var(--orange)' })
  })

  it('returns var(--blue) accent for tipo "express"', () => {
    const draft = makeDraft({ tipo: 'express' })
    const { accentStyle } = useReservationDerived(draft, BRANCHES)
    expect(accentStyle.value).toEqual({ '--accent': 'var(--blue)' })
  })
})

describe('useReservationDerived — scheduleForDate', () => {
  it('returns null when branchId is not set', () => {
    const draft = makeDraft({ branchId: null, date: '2099-12-31' })
    const { scheduleForDate } = useReservationDerived(draft, BRANCHES)
    expect(scheduleForDate.value).toBeNull()
  })

  it('returns null when date is not set', () => {
    const draft = makeDraft({ branchId: 'branch-ayce-1', date: '' })
    const { scheduleForDate } = useReservationDerived(draft, BRANCHES)
    expect(scheduleForDate.value).toBeNull()
  })

  it('returns the correct schedule slot for Thursday (2099-12-31)', () => {
    // 2099-12-31 is a Thursday → key "thu"
    const draft = makeDraft({ branchId: 'branch-ayce-1', date: '2099-12-31' })
    const { scheduleForDate } = useReservationDerived(draft, BRANCHES)
    expect(scheduleForDate.value).toEqual({ open: '14:00', close: '23:00' })
  })

  it('returns null when the branch schedule for that day is null (express, Saturday)', () => {
    // EXPRESS_BRANCH has sat: null
    // 2100-01-02 is Saturday
    const draft = makeDraft({
      branchId: 'branch-express-1',
      date: '2100-01-02',
    })
    const { scheduleForDate } = useReservationDerived(draft, BRANCHES)
    expect(scheduleForDate.value).toBeNull()
  })
})

describe('useReservationDerived — horaMin and horaMax', () => {
  it('horaMin is empty string when scheduleForDate is null', () => {
    const draft = makeDraft({ branchId: null, date: '' })
    const { horaMin } = useReservationDerived(draft, BRANCHES)
    expect(horaMin.value).toBe('')
  })

  it('horaMax is empty string when scheduleForDate is null', () => {
    const draft = makeDraft({ branchId: null, date: '' })
    const { horaMax } = useReservationDerived(draft, BRANCHES)
    expect(horaMax.value).toBe('')
  })

  it('horaMin reflects the schedule open time', () => {
    // Thursday slot: open=14:00, close=23:00
    const draft = makeDraft({ branchId: 'branch-ayce-1', date: '2099-12-31' })
    const { horaMin } = useReservationDerived(draft, BRANCHES)
    expect(horaMin.value).toBe('14:00')
  })

  it('horaMax is close minus 30 minutes (23:00 → 22:30)', () => {
    // Thursday slot: open=14:00, close=23:00 → horaMax = 22:30
    const draft = makeDraft({ branchId: 'branch-ayce-1', date: '2099-12-31' })
    const { horaMax } = useReservationDerived(draft, BRANCHES)
    expect(horaMax.value).toBe('22:30')
  })

  it('horaMax is close minus 30 minutes (22:00 → 21:30)', () => {
    // Monday slot: open=13:00, close=22:00 → horaMax = 21:30
    // 2099-12-28 is a Monday (31=Thu, 30=Wed, 29=Tue, 28=Mon)
    const draft = makeDraft({ branchId: 'branch-ayce-1', date: '2099-12-28' })
    const { horaMax } = useReservationDerived(draft, BRANCHES)
    expect(horaMax.value).toBe('21:30')
  })
})

describe('useReservationDerived — todayIso and maxDateIso', () => {
  it('todayIso is a valid YYYY-MM-DD ISO date string', () => {
    const draft = makeDraft()
    const { todayIso } = useReservationDerived(draft, BRANCHES)
    expect(todayIso.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('maxDateIso is a valid YYYY-MM-DD ISO date string', () => {
    const draft = makeDraft()
    const { maxDateIso } = useReservationDerived(draft, BRANCHES)
    expect(maxDateIso.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('maxDateIso is 30 days after todayIso', () => {
    const draft = makeDraft()
    const { todayIso, maxDateIso } = useReservationDerived(draft, BRANCHES)
    const today = new Date(todayIso.value + 'T00:00:00')
    const max = new Date(maxDateIso.value + 'T00:00:00')
    const diffDays = Math.round(
      (max.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    expect(diffDays).toBe(30)
  })
})
