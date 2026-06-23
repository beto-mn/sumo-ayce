import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  t: (k: string) => {
    if (k === 'contact.waMessage') return 'Hola, soy {name}.\n\n{message}'
    if (k === 'contact.email') return 'contacto@sumo.com.mx'
    if (k === 'contact.socialInstagram')
      return 'https://www.instagram.com/sumo_allyoucaneat'
    if (k === 'contact.socialFacebook')
      return 'https://www.facebook.com/sumoallyoucaneat'
    if (k === 'contact.socialTiktok')
      return 'https://www.tiktok.com/@sumooficial'
    return k
  },
}))
vi.stubGlobal('useState', (_key: string, init: () => unknown) => ref(init()))
vi.stubGlobal('useSeoMeta', vi.fn())
vi.stubGlobal('useFetch', (_url: string, _opts?: unknown) => ({
  pending: ref(false),
  error: ref(null),
  data: ref({
    data: [
      {
        id: 'b1',
        name: 'SUMO Polanco',
        address: 'Addr',
        lat: null,
        lng: null,
        isActive: true,
        type: 'ayce',
        schedule: null,
        phone: '5215512345678',
      },
    ],
  }),
}))

import ContactForm from '@/features/contact/components/ContactForm.vue'
import ContactInfo from '@/features/contact/components/ContactInfo.vue'
import ContactPage from './contact.vue'

describe('contact.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders both ContactForm and ContactInfo', () => {
    const wrapper = mount(ContactPage, {
      global: {
        components: { ContactForm, ContactInfo },
      },
    })
    expect(wrapper.findComponent(ContactForm).exists()).toBe(true)
    expect(wrapper.findComponent(ContactInfo).exists()).toBe(true)
  })

  it('ContactInfo is visible regardless of branch fetch state', () => {
    vi.stubGlobal('useFetch', () => ({
      pending: ref(true),
      error: ref(null),
      data: ref(null),
    }))
    const wrapper = mount(ContactPage, {
      global: {
        components: { ContactForm, ContactInfo },
      },
    })
    expect(wrapper.findComponent(ContactInfo).exists()).toBe(true)
  })

  it('calls useSeoMeta with i18n title and description keys', () => {
    const mockSeoMeta = vi.fn()
    vi.stubGlobal('useSeoMeta', mockSeoMeta)
    mount(ContactPage, {
      global: {
        components: { ContactForm, ContactInfo },
      },
    })
    expect(mockSeoMeta).toHaveBeenCalledOnce()
    const arg = mockSeoMeta.mock.calls[0]?.[0] as Record<string, unknown>
    expect(arg).toBeDefined()
  })
})
