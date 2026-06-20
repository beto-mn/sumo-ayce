import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import SiteLogo from './SiteLogo.vue'

const stubs = { NuxtLink: RouterLinkStub }

function mountLogo(props: Record<string, unknown> = {}) {
  return mount(SiteLogo, { props, global: { stubs } })
}

describe('SiteLogo', () => {
  it('renders the original horizontal SUMO lockup with no backing box', () => {
    const wrapper = mountLogo()
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('/brand/sumo-horizontal.svg')
    expect(img.attributes('alt')).toBe('SUMO — All You Can Eat')
    // The logo is rendered BARE: no badge wrapper, no background fill. Its own
    // black sticker outline keeps it legible on the cream nav.
    const link = wrapper.findComponent(RouterLinkStub)
    expect(link.classes()).not.toContain('bg-black')
    expect(link.classes()).not.toContain('bg-ink')
    expect(link.classes().some(c => c.startsWith('bg-'))).toBe(false)
  })

  it('links home by default with an accessible label', () => {
    const link = mountLogo().findComponent(RouterLinkStub)
    expect(link.props('to')).toBe('/')
    expect(link.attributes('aria-label')).toBe('SUMO — All You Can Eat')
  })

  it('honors custom to and label props', () => {
    const link = mountLogo({ to: '/en', label: 'Inicio' }).findComponent(
      RouterLinkStub
    )
    expect(link.props('to')).toBe('/en')
    expect(link.attributes('aria-label')).toBe('Inicio')
  })

  it('carries the brand data attribute for the unmodified mark', () => {
    expect(mountLogo().find('[data-logo="sumo"]').exists()).toBe(true)
  })
})
