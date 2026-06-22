import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
}))
vi.stubGlobal('useLocalePath', () => (p: string) => p)

import SiteFooter from './SiteFooter.vue'

const stubs = {
  SiteLogo: { template: '<a class="logo-stub" />' },
  UiKicker: { template: '<span class="kicker-stub"><slot /></span>' },
  NuxtLink: RouterLinkStub,
}

function mountFooter(props: Record<string, unknown> = {}) {
  return mount(SiteFooter, { props, global: { stubs } })
}

describe('SiteFooter', () => {
  it('renders a footer landmark', () => {
    expect(mountFooter().find('footer').exists()).toBe(true)
  })

  it('reuses the shared SiteLogo badge', () => {
    expect(mountFooter().find('.logo-stub').exists()).toBe(true)
  })

  it('renders the five navigation links pointing at header routes', () => {
    const targets = mountFooter()
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/')
    expect(targets).toContain('/menu')
    expect(targets).toContain('/promotions')
    expect(targets).toContain('/branches')
    expect(targets).toContain('/contact')
  })

  it('renders the three external social links with real hrefs (no placeholders)', () => {
    const anchors = mountFooter().findAll('a[target="_blank"]')
    const hrefs = anchors.map(a => a.attributes('href'))
    expect(hrefs).toHaveLength(3)
    expect(hrefs).not.toContain('#')
    expect(hrefs).toContain('https://www.instagram.com/sumo_allyoucaneat')
    expect(hrefs).toContain('https://www.facebook.com/sumoallyoucaneat')
    expect(hrefs).toContain('https://www.tiktok.com/@sumooficial')
    anchors.forEach(a => {
      expect(a.attributes('rel')).toBe('noopener noreferrer')
    })
  })

  it('links the Contacto column to the contact page internally', () => {
    const contactLink = mountFooter()
      .findAllComponents(RouterLinkStub)
      .find(l => l.text() === 'footer.contact.whatsapp')
    expect(contactLink).toBeDefined()
    expect(contactLink?.props('to')).toBe('/contact')
  })

  it('exposes three labelled nav landmarks (navegación + redes + contacto)', () => {
    const navs = mountFooter().findAll('nav[aria-label]')
    expect(navs.length).toBe(3)
  })

  it('renders the provided copyright year', () => {
    expect(mountFooter({ year: 2031 }).text()).toContain('© SUMO AYCE 2031')
  })
})
