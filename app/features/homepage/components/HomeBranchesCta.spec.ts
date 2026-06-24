import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeBranchesCta from './HomeBranchesCta.vue'

vi.stubGlobal('useI18n', () => ({ t: (k: string) => k }))
vi.stubGlobal('useLocalePath', () => (p: string) => p)

const stubs = {
  UiButton: { template: '<button class="btn-stub"><slot /></button>' },
  UiKicker: { template: '<span><slot /></span>' },
  NuxtLink: RouterLinkStub,
}

function mountCta() {
  return mount(HomeBranchesCta, { global: { stubs } })
}

describe('HomeBranchesCta', () => {
  it('links the branches control to /branches', () => {
    const links = mountCta().findAllComponents(RouterLinkStub)
    expect(links.map(l => l.props('to'))).toContain('/branches')
  })

  it('links the reserve control to /reserve', () => {
    const links = mountCta().findAllComponents(RouterLinkStub)
    expect(links.map(l => l.props('to'))).toContain('/reserve')
  })

  it('renders two links (find branch and reserve)', () => {
    const links = mountCta().findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
  })
})
