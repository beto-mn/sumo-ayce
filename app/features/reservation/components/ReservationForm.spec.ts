import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Branch } from '../types'
import ReservationForm from './ReservationForm.vue'

// Stub Nuxt auto-imports used by ReservationForm
vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('$fetch', vi.fn())

const stubs = {
  UiButton: {
    template:
      '<button v-bind="$attrs" :type="type" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props: ['type', 'disabled', 'loading'],
    emits: ['click'],
    inheritAttrs: false,
  },
  ReservationConfirmation: {
    template:
      '<div data-testid="reservation-confirmation"><span data-testid="folio">{{ confirmation.folio }}</span><span data-testid="branch-name">{{ confirmation.branchName }}</span><span data-testid="conf-date">{{ confirmation.date }}</span><span data-testid="conf-time">{{ confirmation.time }}</span><span data-testid="conf-party-size">{{ confirmation.partySize }}</span><button data-testid="reset-button" @click="$emit(\'reset\')">Reset</button></div>',
    props: ['confirmation'],
    emits: ['reset'],
  },
}

const AYCE_BRANCH: Branch = {
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
}

const EXPRESS_BRANCH: Branch = {
  id: 'branch-uuid-2',
  name: 'SUMO Express',
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

function futureDateIso(daysAhead = 5): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── US1: Pre-fill from query params ──────────────────────────────────────────

describe('ReservationForm — pre-fill from query params (US1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pre-selects branch when initialBranchId matches a branch in the list', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialBranchId: 'branch-uuid-1' },
      global: { stubs },
    })
    const select = wrapper.find('[data-testid="branch-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('branch-uuid-1')
  })

  it('Tipo defaults to AYCE when initialTipo is "ayce"', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialTipo: 'ayce' },
      global: { stubs },
    })
    const tipoSelect = wrapper.find('[data-testid="tipo-select"]')
    expect((tipoSelect.element as HTMLSelectElement).value).toBe('ayce')
  })

  it('wrapper has orange accent style when tipo is ayce', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialTipo: 'ayce' },
      global: { stubs },
    })
    const wrapperEl = wrapper.find('[data-testid="form-wrapper"]')
    expect(wrapperEl.attributes('style')).toContain('var(--orange)')
  })

  it('Tipo defaults to Express when initialTipo is "express"', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialTipo: 'express' },
      global: { stubs },
    })
    const tipoSelect = wrapper.find('[data-testid="tipo-select"]')
    expect((tipoSelect.element as HTMLSelectElement).value).toBe('express')
  })

  it('wrapper has blue accent style when tipo is express', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialTipo: 'express' },
      global: { stubs },
    })
    const wrapperEl = wrapper.find('[data-testid="form-wrapper"]')
    expect(wrapperEl.attributes('style')).toContain('var(--blue)')
  })

  it('Sucursal remains unselected when no initialBranchId provided', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    const select = wrapper.find('[data-testid="branch-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('')
  })

  it('defaults to AYCE when no initialTipo provided', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    const tipoSelect = wrapper.find('[data-testid="tipo-select"]')
    expect((tipoSelect.element as HTMLSelectElement).value).toBe('ayce')
  })

  it('Sucursal remains unselected when initialBranchId is unknown', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialBranchId: 'non-existent-uuid' },
      global: { stubs },
    })
    const select = wrapper.find('[data-testid="branch-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('')
  })

  it('defaults to AYCE when initialTipo is invalid value', () => {
    const wrapper = mount(ReservationForm, {
      // @ts-expect-error intentional invalid value
      props: { branches: BRANCHES, initialTipo: 'invalid' },
      global: { stubs },
    })
    const tipoSelect = wrapper.find('[data-testid="tipo-select"]')
    expect((tipoSelect.element as HTMLSelectElement).value).toBe('ayce')
  })
})

// ─── US2: Submit & Confirmation ───────────────────────────────────────────────

describe('ReservationForm — submit & confirmation (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function mountAndFill(fetchMock: ReturnType<typeof vi.fn>) {
    vi.stubGlobal('$fetch', fetchMock)
    const wrapper = mount(ReservationForm, {
      props: {
        branches: BRANCHES,
        initialBranchId: 'branch-uuid-1',
        initialTipo: 'ayce',
      },
      global: { stubs },
    })
    // Fill date field
    const dateInput = wrapper.find('[data-testid="date-input"]')
    await dateInput.setValue(futureDateIso())
    // Fill time via native time input
    await wrapper.find('[data-testid="time-input"]').setValue('14:00')
    // Fill party size
    const partySelect = wrapper.find('[data-testid="party-size-select"]')
    await partySelect.setValue('4')
    // Fill name
    const nameInput = wrapper.find('[data-testid="name-input"]')
    await nameInput.setValue('Juan Pérez')
    // Fill phone
    const phoneInput = wrapper.find('[data-testid="phone-input"]')
    await phoneInput.setValue('5512345678')
    return wrapper
  }

  it('form is visible initially', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    expect(wrapper.find('[data-testid="reservation-form"]').exists()).toBe(true)
    expect(
      wrapper.find('[data-testid="reservation-confirmation"]').exists()
    ).toBe(false)
  })

  it('API 201 → shows confirmation screen with folio', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ data: { folio: 'SUMO-9999' } })
    const wrapper = await mountAndFill(fetchMock)
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    await flushPromises()
    expect(
      wrapper.find('[data-testid="reservation-confirmation"]').exists()
    ).toBe(true)
    expect(wrapper.find('[data-testid="folio"]').text()).toBe('SUMO-9999')
  })

  it('confirmation shows branch name from branch list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ data: { folio: 'SUMO-1111' } })
    const wrapper = await mountAndFill(fetchMock)
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    await flushPromises()
    expect(wrapper.find('[data-testid="branch-name"]').text()).toBe(
      'SUMO Polanco'
    )
  })

  it('"Hacer otra reservación" resets form and hides confirmation', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ data: { folio: 'SUMO-1111' } })
    const wrapper = await mountAndFill(fetchMock)
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    await flushPromises()
    expect(
      wrapper.find('[data-testid="reservation-confirmation"]').exists()
    ).toBe(true)
    await wrapper.find('[data-testid="reset-button"]').trigger('click')
    expect(wrapper.find('[data-testid="reservation-form"]').exists()).toBe(true)
    expect(
      wrapper.find('[data-testid="reservation-confirmation"]').exists()
    ).toBe(false)
  })
})

// ─── US3: Error handling ──────────────────────────────────────────────────────

describe('ReservationForm — API / network error handling (US3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function submitWithError(error: Error) {
    vi.stubGlobal('$fetch', vi.fn().mockRejectedValue(error))
    const wrapper = mount(ReservationForm, {
      props: {
        branches: BRANCHES,
        initialBranchId: 'branch-uuid-1',
        initialTipo: 'ayce',
      },
      global: { stubs },
    })
    const dateInput = wrapper.find('[data-testid="date-input"]')
    await dateInput.setValue(futureDateIso())
    await wrapper.find('[data-testid="time-input"]').setValue('14:00')
    await wrapper.find('[data-testid="party-size-select"]').setValue('2')
    await wrapper.find('[data-testid="name-input"]').setValue('Test User')
    await wrapper.find('[data-testid="phone-input"]').setValue('5599887766')
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    await flushPromises()
    return wrapper
  }

  it('API 500 → error banner visible', async () => {
    const wrapper = await submitWithError(new Error('Internal Server Error'))
    expect(wrapper.find('[data-testid="api-error"]').exists()).toBe(true)
  })

  it('network failure → error banner visible', async () => {
    const wrapper = await submitWithError(new TypeError('Failed to fetch'))
    expect(wrapper.find('[data-testid="api-error"]').exists()).toBe(true)
  })

  it('after error, editing a field clears the error banner', async () => {
    const wrapper = await submitWithError(new Error('500'))
    expect(wrapper.find('[data-testid="api-error"]').exists()).toBe(true)
    await wrapper.find('[data-testid="name-input"]').trigger('input')
    expect(wrapper.find('[data-testid="api-error"]').exists()).toBe(false)
  })
})

// ─── US4: Client-side field validation ────────────────────────────────────────

describe('ReservationForm — per-field validation (US4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('empty form submit → branch error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-branch"]').exists()).toBe(true)
  })

  it('empty form submit → date error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-date"]').exists()).toBe(true)
  })

  it('empty form submit → time error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-time"]').exists()).toBe(true)
  })

  it('empty form submit → party size error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-party-size"]').exists()).toBe(true)
  })

  it('empty form submit → name error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-name"]').exists()).toBe(true)
  })

  it('empty form submit → phone error shown', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    expect(wrapper.find('[data-testid="error-phone"]').exists()).toBe(true)
  })

  it('empty form submit → API not called', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('$fetch', fetchMock)
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    await wrapper.find('[data-testid="reservation-form"]').trigger('submit')
    await flushPromises()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

// ─── US5: Time slot generation in form ────────────────────────────────────────

describe('ReservationForm — time slot generation (US5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('no branch selected → time input is disabled', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES },
      global: { stubs },
    })
    const timeInput = wrapper.find('[data-testid="time-input"]')
    expect((timeInput.element as HTMLInputElement).disabled).toBe(true)
  })

  it('branch + date selected → time input is enabled with min/max', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialBranchId: 'branch-uuid-1' },
      global: { stubs },
    })
    await wrapper.find('[data-testid="date-input"]').setValue(futureDateIso())
    const timeInput = wrapper.find('[data-testid="time-input"]')
    expect((timeInput.element as HTMLInputElement).disabled).toBe(false)
    expect(timeInput.attributes('min')).toBe('13:00')
    expect(timeInput.attributes('max')).toBe('21:30')
  })

  it('branch with no schedule → time input has no min/max', async () => {
    const branchNoSchedule: Branch = {
      id: 'branch-no-sched',
      name: 'SUMO Test',
      type: 'ayce',
      schedule: null,
    }
    const wrapper = mount(ReservationForm, {
      props: {
        branches: [...BRANCHES, branchNoSchedule],
        initialBranchId: 'branch-no-sched',
      },
      global: { stubs },
    })
    await wrapper.find('[data-testid="date-input"]').setValue(futureDateIso())
    const timeInput = wrapper.find('[data-testid="time-input"]')
    expect(timeInput.attributes('min')).toBe('')
    expect(timeInput.attributes('max')).toBe('')
  })

  it('changing branch clears time selection', async () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialBranchId: 'branch-uuid-1' },
      global: { stubs },
    })
    await wrapper.find('[data-testid="date-input"]').setValue(futureDateIso())
    await wrapper.find('[data-testid="time-input"]').setValue('14:00')
    await wrapper
      .find('[data-testid="branch-select"]')
      .setValue('branch-uuid-2')
    const timeInput = wrapper.find('[data-testid="time-input"]')
    expect((timeInput.element as HTMLInputElement).value).toBe('')
  })

  it('changing tipo clears branchId and time', async () => {
    const wrapper = mount(ReservationForm, {
      props: {
        branches: BRANCHES,
        initialBranchId: 'branch-uuid-1',
        initialTipo: 'ayce',
      },
      global: { stubs },
    })
    await wrapper.find('[data-testid="date-input"]').setValue(futureDateIso())
    // Switch tipo to express
    await wrapper.find('[data-testid="tipo-select"]').setValue('express')
    // Branch select should be reset (empty value)
    const branchSelect = wrapper.find('[data-testid="branch-select"]')
    expect((branchSelect.element as HTMLSelectElement).value).toBe('')
  })

  it('sucursal dropdown only shows branches matching tipo', () => {
    const wrapper = mount(ReservationForm, {
      props: { branches: BRANCHES, initialTipo: 'express' },
      global: { stubs },
    })
    const branchSelect = wrapper.find('[data-testid="branch-select"]')
    const options = Array.from(
      (branchSelect.element as HTMLSelectElement).options
    ).filter(o => o.value !== '')
    // Only EXPRESS_BRANCH should be listed
    expect(options).toHaveLength(1)
    expect(options[0]?.text).toBe('SUMO Express')
  })
})
