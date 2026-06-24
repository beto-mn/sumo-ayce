import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import ReservationFieldsContact from './ReservationFieldsContact.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))

const PARTY_SIZE_OPTIONS = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))

const defaultProps = {
  name: '',
  partySize: null,
  phone: '',
  partySizeOptions: PARTY_SIZE_OPTIONS,
  errorName: undefined,
  errorPartySize: undefined,
  errorPhone: undefined,
  isSubmitting: false,
  nameDisabled: false,
}

describe('ReservationFieldsContact', () => {
  it('renders name input', () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
  })

  it('renders party size select with placeholder option', () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    const select = wrapper.find('[data-testid="party-size-select"]')
    expect((select.element as HTMLSelectElement).value).toBe('')
  })

  it('renders party size options', () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    const select = wrapper.find('[data-testid="party-size-select"]')
    const opts = Array.from(
      (select.element as HTMLSelectElement).options
    ).filter(o => o.value !== '')
    expect(opts).toHaveLength(20)
    expect(opts[0]?.text).toBe('1')
  })

  it('emits update:name when name input changes', async () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    await wrapper.find('[data-testid="name-input"]').setValue('Juan Pérez')
    expect(wrapper.emitted('update:name')).toBeTruthy()
    expect(wrapper.emitted('update:name')?.[0]).toEqual(['Juan Pérez'])
  })

  it('emits update:partySize as number when party size changes', async () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    await wrapper.find('[data-testid="party-size-select"]').setValue('4')
    expect(wrapper.emitted('update:partySize')).toBeTruthy()
    expect(wrapper.emitted('update:partySize')?.[0]).toEqual([4])
  })

  it('emits update:phone when phone input changes', async () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    await wrapper.find('[data-testid="phone-input"]').setValue('5512345678')
    expect(wrapper.emitted('update:phone')).toBeTruthy()
    expect(wrapper.emitted('update:phone')?.[0]).toEqual(['5512345678'])
  })

  it('emits field-edit when any field changes', async () => {
    const wrapper = mount(ReservationFieldsContact, { props: defaultProps })
    await wrapper.find('[data-testid="name-input"]').setValue('Test')
    expect(wrapper.emitted('field-edit')).toBeTruthy()
  })

  it('shows name error when errorName is set', () => {
    const wrapper = mount(ReservationFieldsContact, {
      props: { ...defaultProps, errorName: 'reservation.error.name_required' },
    })
    expect(wrapper.find('[data-testid="error-name"]').exists()).toBe(true)
  })

  it('shows party size error when errorPartySize is set', () => {
    const wrapper = mount(ReservationFieldsContact, {
      props: {
        ...defaultProps,
        errorPartySize: 'reservation.error.party_size',
      },
    })
    expect(wrapper.find('[data-testid="error-party-size"]').exists()).toBe(true)
  })

  it('shows phone error when errorPhone is set', () => {
    const wrapper = mount(ReservationFieldsContact, {
      props: { ...defaultProps, errorPhone: 'reservation.error.phone_invalid' },
    })
    expect(wrapper.find('[data-testid="error-phone"]').exists()).toBe(true)
  })

  it('disables name input when nameDisabled is true', () => {
    const wrapper = mount(ReservationFieldsContact, {
      props: { ...defaultProps, nameDisabled: true },
    })
    expect(
      (wrapper.find('[data-testid="name-input"]').element as HTMLInputElement)
        .disabled
    ).toBe(true)
  })
})
