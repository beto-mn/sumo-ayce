import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ContactBranch } from '../types'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  t: (k: string) => {
    const map: Record<string, string> = {
      'contact.info.whatsappPrompt': 'Elige una sucursal para ver su número',
      'contact.info.whatsappLabel': 'WhatsApp de la sucursal',
      'contact.info.emailLabel': 'Correo electrónico',
      'contact.info.socialTitle': 'Síguenos',
      'contact.info.title': 'Información de contacto',
      'contact.email': 'contacto@sumo.com.mx',
      'contact.socialInstagram': 'https://www.instagram.com/sumo_allyoucaneat',
      'contact.socialFacebook': 'https://www.facebook.com/sumoallyoucaneat',
      'contact.socialTiktok': 'https://www.tiktok.com/@sumooficial',
    }
    return map[k] ?? k
  },
}))

import ContactInfo from './ContactInfo.vue'

const BRANCH: ContactBranch = {
  id: 'b1',
  name: 'SUMO Polanco',
  phone: '5215512345678',
}

describe('ContactInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── WhatsApp section ─────────────────────────────────────────────────────────

  it('shows whatsappPrompt when selectedBranch is null', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    expect(wrapper.text()).toContain('Elige una sucursal para ver su número')
  })

  it('does not render WhatsApp pill when selectedBranch is null', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    expect(wrapper.find('[data-testid="whatsapp-pill"]').exists()).toBe(false)
  })

  it('renders WhatsApp pill when selectedBranch is provided', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: BRANCH, name: '', message: '' },
    })
    expect(wrapper.find('[data-testid="whatsapp-pill"]').exists()).toBe(true)
  })

  it('WhatsApp pill links to correct wa.me URL', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: BRANCH, name: '', message: '' },
    })
    const pill = wrapper.find('[data-testid="whatsapp-pill"]')
    expect(pill.attributes('href')).toBe('https://wa.me/5215512345678')
  })

  it('WhatsApp pill opens in new tab', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: BRANCH, name: '', message: '' },
    })
    const pill = wrapper.find('[data-testid="whatsapp-pill"]')
    expect(pill.attributes('target')).toBe('_blank')
  })

  it('WhatsApp pill does not show when branch changes back to null', async () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: BRANCH, name: '', message: '' },
    })
    await wrapper.setProps({ selectedBranch: null })
    expect(wrapper.find('[data-testid="whatsapp-pill"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Elige una sucursal para ver su número')
  })

  // ── Email section ────────────────────────────────────────────────────────────

  it('renders email link with mailto:contacto@sumo.com.mx', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const emailLink = wrapper.find('[data-testid="email-link"]')
    expect(emailLink.exists()).toBe(true)
    expect(emailLink.attributes('href')).toMatch(
      /^mailto:contacto@sumo\.com\.mx/
    )
  })

  it('email link has no query params when name and message are empty', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const emailLink = wrapper.find('[data-testid="email-link"]')
    const href = emailLink.attributes('href') ?? ''
    // Either just mailto: or with empty params — not "subject=SUMO+—+undefined"
    expect(href).not.toContain('undefined')
  })

  it('email link subject includes branch name when branch is selected', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: BRANCH, name: 'Ana', message: 'Hola' },
    })
    const href =
      wrapper.find('[data-testid="email-link"]').attributes('href') ?? ''
    expect(href).toContain(encodeURIComponent('SUMO Polanco'))
  })

  it('email link body includes name when name is provided', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: 'Ana', message: 'Hola' },
    })
    const href =
      wrapper.find('[data-testid="email-link"]').attributes('href') ?? ''
    expect(href).toContain(encodeURIComponent('Ana'))
  })

  it('email link body includes message when message is provided', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: 'Ana', message: 'Quiero reservar' },
    })
    const href =
      wrapper.find('[data-testid="email-link"]').attributes('href') ?? ''
    expect(href).toContain(encodeURIComponent('Quiero reservar'))
  })

  // ── Social pills ─────────────────────────────────────────────────────────────

  it('renders exactly three social pills', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const pills = wrapper.findAll('[data-testid^="social-"]')
    expect(pills).toHaveLength(3)
  })

  it('Instagram pill links to correct URL', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const ig = wrapper.find('[data-testid="social-instagram"]')
    expect(ig.attributes('href')).toBe(
      'https://www.instagram.com/sumo_allyoucaneat'
    )
  })

  it('Facebook pill links to correct URL', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const fb = wrapper.find('[data-testid="social-facebook"]')
    expect(fb.attributes('href')).toBe(
      'https://www.facebook.com/sumoallyoucaneat'
    )
  })

  it('TikTok pill links to correct URL', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const tt = wrapper.find('[data-testid="social-tiktok"]')
    expect(tt.attributes('href')).toBe('https://www.tiktok.com/@sumooficial')
  })

  it('all social pills have target="_blank"', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const pills = wrapper.findAll('[data-testid^="social-"]')
    for (const pill of pills) {
      expect(pill.attributes('target')).toBe('_blank')
    }
  })

  it('all social pills have rel="noopener noreferrer"', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const pills = wrapper.findAll('[data-testid^="social-"]')
    for (const pill of pills) {
      expect(pill.attributes('rel')).toContain('noopener')
      expect(pill.attributes('rel')).toContain('noreferrer')
    }
  })

  it('all social pills have accessible names', () => {
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    const pills = wrapper.findAll('[data-testid^="social-"]')
    for (const pill of pills) {
      const hasAriaLabel = pill.attributes('aria-label')
      const hasText = pill.text().trim().length > 0
      expect(hasAriaLabel || hasText).toBeTruthy()
    }
  })

  // ── i18n EN ──────────────────────────────────────────────────────────────────

  it('renders prompt text from i18n key (EN locale sim)', () => {
    // Simulate EN locale by overriding the stub
    vi.stubGlobal('useI18n', () => ({
      t: (k: string) => {
        if (k === 'contact.info.whatsappPrompt')
          return 'Select a branch to see its number'
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
    const wrapper = mount(ContactInfo, {
      props: { selectedBranch: null, name: '', message: '' },
    })
    expect(wrapper.text()).toContain('Select a branch to see its number')
  })
})
