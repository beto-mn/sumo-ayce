import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => key,
  locale: { value: 'es' },
}))
vi.stubGlobal('useLocalePath', () => (p: string) => p)
vi.stubGlobal('useSwitchLocalePath', () => (l: string) => `/${l}`)
vi.stubGlobal('useRoute', () => ({ path: '/' }))

import SiteHeader from './SiteHeader.vue'

const stubs = {
  UiNav: {
    template:
      '<nav><slot name="logo" /><slot name="links" /><slot name="actions" /></nav>',
  },
  UiButton: { template: '<button class="btn-stub"><slot /></button>' },
  NuxtLink: RouterLinkStub,
}

function mountHeader() {
  return mount(SiteHeader, { global: { stubs } })
}

describe('SiteHeader', () => {
  it('renders the five public nav links', () => {
    const wrapper = mountHeader()
    const labels = wrapper.findAllComponents(RouterLinkStub).map(l => l.text())
    expect(labels).toContain('nav.home')
    expect(labels).toContain('nav.menu')
    expect(labels).toContain('nav.promotions')
    expect(labels).toContain('nav.branches')
    expect(labels).toContain('nav.contact')
  })

  it('points the nav links at the expected routes', () => {
    const targets = mountHeader()
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/')
    expect(targets).toContain('/menu')
    expect(targets).toContain('/promotions')
    expect(targets).toContain('/branches')
    expect(targets).toContain('/contact')
  })

  it('marks the active route (Inicio on /) with aria-current', () => {
    const active = mountHeader()
      .findAllComponents(RouterLinkStub)
      .find(l => l.props('to') === '/')
    expect(active?.attributes('aria-current')).toBe('page')
  })

  it('renders a language toggle linking to the other locale', () => {
    const toggle = mountHeader()
      .findAllComponents(RouterLinkStub)
      .find(l => l.props('to') === '/en')
    expect(toggle).toBeTruthy()
    expect(toggle?.text()).toBe('common.lang.toggle')
  })

  it('Reserve button links to /reserve', () => {
    const targets = mountHeader()
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/reserve')
  })
})
