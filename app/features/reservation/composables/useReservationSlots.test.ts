import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { Branch } from '../types'
import { generateSlots, useReservationSlots } from './useReservationSlots'

describe('generateSlots — pure function', () => {
  it('returns full range for a future date (open=13:00, close=22:00)', () => {
    const slots = generateSlots('13:00', '22:00', '2099-12-31')
    expect(slots[0]).toBe('13:00')
    expect(slots[slots.length - 1]).toBe('21:30')
    // 13:00, 13:15, ..., 21:30 → 15-min intervals, last = close - 30 min
    // (21*60+30 - 13*60) / 15 + 1 = 510/15 + 1 = 35 slots
    expect(slots).toHaveLength(35)
  })

  it('returns empty array when open is empty string', () => {
    expect(generateSlots('', '22:00', '2099-12-31')).toEqual([])
  })

  it('returns empty array when close is empty string', () => {
    expect(generateSlots('13:00', '', '2099-12-31')).toEqual([])
  })

  it('returns empty array when both open and close are empty', () => {
    expect(generateSlots('', '', '2099-12-31')).toEqual([])
  })

  it('boundary: first slot equals open time', () => {
    const slots = generateSlots('09:00', '10:00', '2099-12-31')
    expect(slots[0]).toBe('09:00')
  })

  it('boundary: last slot is close minus 30 min', () => {
    const slots = generateSlots('09:00', '10:00', '2099-12-31')
    expect(slots[slots.length - 1]).toBe('09:30')
    // 09:00, 09:15, 09:30 → 3 slots
    expect(slots).toHaveLength(3)
  })

  it('does not include the close time as a slot', () => {
    const slots = generateSlots('13:00', '22:00', '2099-12-31')
    expect(slots).not.toContain('22:00')
  })

  it('generates correct 15-minute intervals', () => {
    const slots = generateSlots('12:00', '13:00', '2099-12-31')
    expect(slots).toEqual(['12:00', '12:15', '12:30'])
  })

  it('zero-pads hours and minutes', () => {
    const slots = generateSlots('09:00', '09:30', '2099-12-31')
    expect(slots[0]).toBe('09:00')
  })

  describe('today filtering', () => {
    beforeEach(() => {
      // Fix "now" to 2026-06-23 15:45 local time
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2026-06-23T15:45:00'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('excludes slots at or before current time when date is today', () => {
      const slots = generateSlots('13:00', '22:00', '2026-06-23')
      // 13:00..15:45 are in the past; current min = 945 (15:45), so min <= 945 skipped
      // first slot > 945 min is 960 min = 16:00
      expect(slots[0]).toBe('16:00')
      expect(slots).not.toContain('15:45')
      expect(slots).not.toContain('15:30')
      expect(slots).not.toContain('15:00')
    })

    it('includes all slots for a future date even if current time is mid-day', () => {
      const slots = generateSlots('13:00', '22:00', '2026-06-24')
      expect(slots[0]).toBe('13:00')
      expect(slots).toHaveLength(35)
    })

    it('returns empty array when all slots are in the past for today', () => {
      // open=09:00, close=10:00, current time 15:45 → no slots left
      const slots = generateSlots('09:00', '10:00', '2026-06-23')
      expect(slots).toEqual([])
    })
  })
})

describe('useReservationSlots — reactive wrapper', () => {
  // 2099-12-31 is a Thursday → key "thu"
  const AYCE_BRANCH: Branch = {
    id: 'abc-123',
    name: 'SUMO Polanco',
    type: 'ayce',
    schedule: {
      mon: null,
      tue: null,
      wed: null,
      thu: { open: '13:00', close: '22:00' },
      fri: null,
      sat: { open: '11:00', close: '23:00' },
      sun: null,
    },
  }

  const BRANCH_NO_SCHEDULE: Branch = {
    id: 'xyz-999',
    name: 'SUMO Buenavista',
    type: 'express',
    schedule: null,
  }

  // Branch with only some days populated
  const BRANCH_SPECIFIC_DAYS: Branch = {
    id: 'wd-only',
    name: 'SUMO Test',
    type: 'ayce',
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

  it('returns empty array when no branch is selected', () => {
    const branch = ref<Branch | null>(null)
    const date = ref('2099-12-31')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value).toEqual([])
  })

  it('returns empty array when no date is set', () => {
    const branch = ref<Branch | null>(AYCE_BRANCH)
    const date = ref('')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value).toEqual([])
  })

  it('returns slots for Thursday using thu schedule key', () => {
    // 2099-12-31 is a Thursday
    const branch = ref<Branch | null>(AYCE_BRANCH)
    const date = ref('2099-12-31')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value[0]).toBe('13:00')
    expect(slots.value[slots.value.length - 1]).toBe('21:30')
    expect(slots.value).toHaveLength(35)
  })

  it('returns slots for Saturday using sat schedule key', () => {
    // 2100-01-02 is a Saturday
    const branch = ref<Branch | null>(AYCE_BRANCH)
    const date = ref('2100-01-02')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value[0]).toBe('11:00')
    expect(slots.value[slots.value.length - 1]).toBe('22:30')
  })

  it('returns empty array when branch has no schedule', () => {
    const branch = ref<Branch | null>(BRANCH_NO_SCHEDULE)
    const date = ref('2099-12-31')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value).toEqual([])
  })

  it('returns empty array when the selected day key is null', () => {
    // Saturday (2100-01-02) has sat: null in BRANCH_SPECIFIC_DAYS
    const branch = ref<Branch | null>(BRANCH_SPECIFIC_DAYS)
    const date = ref('2100-01-02') // Saturday
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value).toEqual([])
  })

  it('uses Monday schedule for a Monday date', () => {
    // Find a Monday date: 2099-12-30 is a Wednesday, so try 2099-12-28 (Mon)
    // Let us verify: 2099-12-31 Thu → 2099-12-29 Tue → 2099-12-28 Mon
    const branch = ref<Branch | null>(BRANCH_SPECIFIC_DAYS)
    const date = ref('2099-12-28') // Monday
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value[0]).toBe('12:00')
  })

  it('recomputes when branch changes', () => {
    const branch = ref<Branch | null>(null)
    const date = ref('2099-12-31')
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value).toEqual([])
    branch.value = AYCE_BRANCH
    expect(slots.value.length).toBeGreaterThan(0)
  })

  it('recomputes when date changes', () => {
    const branch = ref<Branch | null>(AYCE_BRANCH)
    const date = ref('2099-12-31')
    const { slots } = useReservationSlots(branch, date)
    const initialLength = slots.value.length
    date.value = ''
    expect(slots.value).toEqual([])
    date.value = '2099-12-31'
    expect(slots.value.length).toBe(initialLength)
  })

  it('Sunday uses sun schedule key', () => {
    // 2100-01-03 is a Sunday (2100-01-02 Sat + 1 = Sun)
    const branchWithSun: Branch = {
      id: 'sun-branch',
      name: 'SUMO Sunday',
      type: 'ayce',
      schedule: {
        mon: null,
        tue: null,
        wed: null,
        thu: null,
        fri: null,
        sat: null,
        sun: { open: '10:00', close: '21:00' },
      },
    }
    const branch = ref<Branch | null>(branchWithSun)
    const date = ref('2100-01-03') // Sunday
    const { slots } = useReservationSlots(branch, date)
    expect(slots.value[0]).toBe('10:00')
    expect(slots.value[slots.value.length - 1]).toBe('20:30')
  })
})
