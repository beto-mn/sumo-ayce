import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import type { BranchPublicRow } from '@/types/branches'
import type { ContactBranch } from '../types'

function interpolate(
  template: string,
  values?: Record<string, string>
): string {
  if (!values) return template
  return Object.entries(values).reduce(
    (s, [key, val]) => s.replace(`{${key}}`, val),
    template
  )
}

// Stub Nuxt globals — return a template for waMessage so tokens get replaced
vi.stubGlobal('useI18n', () => ({
  t: (k: string, values?: Record<string, string>) => {
    if (k === 'contact.waMessage')
      return interpolate('Hola, soy {name}.\n\n{message}', values)
    return k
  },
}))
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))

// Persistent refs so mounts across tests share the same reactive objects
const mockPending = ref(false)
const mockError = ref<Error | null>(null)
const mockData = ref<{ data: BranchPublicRow[] } | null>(null)

vi.stubGlobal('useFetch', (_url: string, _opts?: unknown) => ({
  pending: mockPending,
  error: mockError,
  data: mockData,
}))

import { state } from '../composables/useContact'
import ContactForm from './ContactForm.vue'

const BASE_BRANCH: BranchPublicRow = {
  id: 'b1',
  name: 'SUMO Polanco',
  address: 'Addr',
  lat: null,
  lng: null,
  isActive: true,
  type: 'ayce',
  schedule: null,
  phone: '5215512345678',
}

const BRANCH_NO_PHONE: BranchPublicRow = {
  id: 'b2',
  name: 'SUMO Buenavista',
  address: 'Addr',
  lat: null,
  lng: null,
  isActive: true,
  type: 'express',
  schedule: null,
  phone: null,
}

describe('ContactForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the persistent refs
    mockPending.value = false
    mockError.value = null
    mockData.value = null
    // Reset shared composable state
    state.name = ''
    state.branchId = ''
    state.message = ''
  })

  it('renders three fields: name input, branch select, message textarea', () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    expect(wrapper.find('[data-testid="name-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="branch-select"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="message-textarea"]').exists()).toBe(true)
  })

  it('does not render a WhatsApp/tel input field', () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    expect(wrapper.find('input[type="tel"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="whatsapp-input"]').exists()).toBe(false)
  })

  it('CTA button is disabled when all fields are empty', () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    const btn = wrapper.find('[data-testid="cta-button"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('CTA button is disabled when only name is filled', async () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    await wrapper.find('[data-testid="name-input"]').setValue('Ana')
    const btn = wrapper.find('[data-testid="cta-button"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('CTA button is enabled when all three fields are filled', async () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    await wrapper.find('[data-testid="name-input"]').setValue('Ana')
    await wrapper.find('[data-testid="branch-select"]').setValue('b1')
    await wrapper.find('[data-testid="message-textarea"]').setValue('Hola')
    const btn = wrapper.find('[data-testid="cta-button"]')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('emits update:selectedBranch with ContactBranch when branch is selected', async () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    await wrapper.find('[data-testid="branch-select"]').setValue('b1')
    const emitted = wrapper.emitted('update:selectedBranch')
    expect(emitted).toBeTruthy()
    const emittedBranch = emitted?.[0]?.[0] as ContactBranch
    expect(emittedBranch).toMatchObject({ id: 'b1', phone: '5215512345678' })
  })

  it('emits update:selectedBranch with null when branch is deselected', async () => {
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    await wrapper.find('[data-testid="branch-select"]').setValue('b1')
    await wrapper.find('[data-testid="branch-select"]').setValue('')
    const emitted = wrapper.emitted('update:selectedBranch')
    expect(emitted).toBeTruthy()
    const lastEmit = emitted?.[emitted.length - 1]?.[0]
    expect(lastEmit).toBeNull()
  })

  it('dropdown shows only branches with non-null phone', () => {
    mockData.value = { data: [BASE_BRANCH, BRANCH_NO_PHONE] }
    const wrapper = mount(ContactForm)
    const options = wrapper.findAll('[data-testid="branch-option"]')
    expect(options).toHaveLength(1)
    expect(options[0]?.attributes('value')).toBe('b1')
  })

  it('shows loading indicator when branches are loading', () => {
    mockPending.value = true
    mockData.value = null
    const wrapper = mount(ContactForm)
    expect(wrapper.find('[data-testid="loading-indicator"]').exists()).toBe(
      true
    )
    expect(wrapper.find('[data-testid="branch-select"]').exists()).toBe(false)
  })

  it('shows error message when branch fetch fails', () => {
    mockError.value = new Error('Network error')
    mockData.value = null
    const wrapper = mount(ContactForm)
    expect(wrapper.find('[data-testid="fetch-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="branch-select"]').exists()).toBe(false)
  })

  it('error message contains no stack trace', () => {
    mockError.value = new Error('Network error')
    mockData.value = null
    const wrapper = mount(ContactForm)
    const errorEl = wrapper.find('[data-testid="fetch-error"]')
    expect(errorEl.text()).not.toContain('Error:')
    expect(errorEl.text()).not.toContain('at ')
  })

  it('CTA button is disabled when fetch has error', () => {
    mockError.value = new Error('Network error')
    const wrapper = mount(ContactForm)
    const btn = wrapper.find('[data-testid="cta-button"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('shows empty state when no branches have a phone', () => {
    mockData.value = { data: [BRANCH_NO_PHONE] }
    const wrapper = mount(ContactForm)
    expect(wrapper.find('[data-testid="empty-branches"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="branch-select"]').exists()).toBe(false)
  })

  it('CTA button is disabled when branches list is empty', () => {
    mockData.value = { data: [BRANCH_NO_PHONE] }
    const wrapper = mount(ContactForm)
    const btn = wrapper.find('[data-testid="cta-button"]')
    expect(btn.attributes('disabled')).toBeDefined()
  })

  it('calls window.open with correct wa.me URL on valid submit', async () => {
    const mockOpen = vi.fn()
    window.open = mockOpen
    mockData.value = { data: [BASE_BRANCH] }
    // Directly set the shared state so isFormValid is true
    state.name = 'Ana'
    state.branchId = 'b1'
    state.message = 'Quiero reservar'
    const wrapper = mount(ContactForm)
    await wrapper.find('form').trigger('submit')
    expect(mockOpen).toHaveBeenCalledOnce()
    const url = mockOpen.mock.calls[0]?.[0] as string
    expect(url).toMatch(/^https:\/\/wa\.me\/5215512345678/)
    expect(url).toContain('text=')
    expect(url).toContain(encodeURIComponent('Ana'))
    expect(url).toContain(encodeURIComponent('Quiero reservar'))
  })

  it('wa.me URL host uses branch phone 5215512345678 verbatim', async () => {
    const mockOpen = vi.fn()
    window.open = mockOpen
    mockData.value = { data: [BASE_BRANCH] }
    state.name = 'Ana'
    state.branchId = 'b1'
    state.message = 'Msg'
    const wrapper = mount(ContactForm)
    await wrapper.find('form').trigger('submit')
    const url = mockOpen.mock.calls[0]?.[0] as string
    expect(url).toMatch(/^https:\/\/wa\.me\/5215512345678\?/)
  })

  it('wa.me text contains name and message but not branch phone', async () => {
    const mockOpen = vi.fn()
    window.open = mockOpen
    mockData.value = { data: [BASE_BRANCH] }
    state.name = 'Ana'
    state.branchId = 'b1'
    state.message = 'Mensaje'
    const wrapper = mount(ContactForm)
    await wrapper.find('form').trigger('submit')
    const url = mockOpen.mock.calls[0]?.[0] as string
    // text param is URL-encoded — check encoded values are present
    expect(url).toContain(encodeURIComponent('Ana'))
    expect(url).toContain(encodeURIComponent('Mensaje'))
    // branch phone should not appear in the text portion
    const textIndex = url.indexOf('text=')
    const textPart = url.slice(textIndex)
    expect(textPart).not.toContain('5215512345678')
  })

  it('window.open is called with _blank target', async () => {
    const mockOpen = vi.fn()
    window.open = mockOpen
    mockData.value = { data: [BASE_BRANCH] }
    state.name = 'Ana'
    state.branchId = 'b1'
    state.message = 'Msg'
    const wrapper = mount(ContactForm)
    await wrapper.find('form').trigger('submit')
    expect(mockOpen.mock.calls[0]?.[1]).toBe('_blank')
  })

  // ── i18n / Language toggle ───────────────────────────────────────────────────

  it('renders English labels when locale is EN', () => {
    vi.stubGlobal('useI18n', () => ({
      t: (k: string, values?: Record<string, string>) => {
        const map: Record<string, string> = {
          'contact.form.title': 'Send us a message',
          'contact.form.name.label': 'Name',
          'contact.form.name.placeholder': 'Your name',
          'contact.form.branch.label': 'Choose a branch',
          'contact.form.branch.placeholder': 'Select a branch',
          'contact.form.message.label': 'Message',
          'contact.form.message.placeholder': 'Write your message here...',
          'contact.form.cta': 'Start WhatsApp chat',
          'contact.waMessage': "Hi, I'm {name}.\n\n{message}",
        }
        return interpolate(map[k] ?? k, values)
      },
    }))
    mockData.value = { data: [BASE_BRANCH] }
    const wrapper = mount(ContactForm)
    expect(wrapper.text()).toContain('Send us a message')
    expect(wrapper.text()).toContain('Name')
    expect(wrapper.text()).toContain('Choose a branch')
    expect(wrapper.text()).toContain('Message')
    expect(wrapper.text()).toContain('Start WhatsApp chat')
  })

  it('EN wa.me text uses visitor typed content not translated copy', async () => {
    vi.stubGlobal('useI18n', () => ({
      t: (k: string, values?: Record<string, string>) => {
        if (k === 'contact.waMessage')
          return interpolate("Hi, I'm {name}.\n\n{message}", values)
        return k
      },
    }))
    const mockOpen = vi.fn()
    window.open = mockOpen
    mockData.value = { data: [BASE_BRANCH] }
    state.name = 'Bob'
    state.branchId = 'b1'
    state.message = 'I want a reservation'
    const wrapper = mount(ContactForm)
    await wrapper.find('form').trigger('submit')
    const url = mockOpen.mock.calls[0]?.[0] as string
    expect(url).toContain(encodeURIComponent('Bob'))
    expect(url).toContain(encodeURIComponent('I want a reservation'))
  })
})
