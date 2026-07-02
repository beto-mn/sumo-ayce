import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ES: Record<string, string> = {
  'home.branches.kicker': 'Sucursales',
  'home.branches.title': 'Más de 30 sucursales en CDMX, EDOMEX y Cuernavaca',
  'home.branches.desc':
    'Encuentra la sucursal más cercana o reserva sin filas.',
  'home.branches.findBranch': 'Encuentra la tuya',
  'home.branches.reserve': 'Reservar',
}

const EN: Record<string, string> = {
  'home.branches.kicker': 'Locations',
  'home.branches.title': '30+ locations across CDMX, EDOMEX and Cuernavaca',
  'home.branches.desc': 'Find your nearest branch or reserve with no queues.',
  'home.branches.findBranch': 'Find yours',
  'home.branches.reserve': 'Reserve',
}

function stubLocale(map: Record<string, string>) {
  vi.stubGlobal('useI18n', () => ({ t: (k: string) => map[k] ?? k }))
  vi.stubGlobal('useLocalePath', () => (p: string) => p)
}

const stubs = {
  UiButton: { template: '<button class="btn-stub"><slot /></button>' },
  UiKicker: { template: '<span><slot /></span>' },
  NuxtLink: RouterLinkStub,
}

async function mountCta(map = ES) {
  stubLocale(map)
  const HomeBranchesCta = (await import('./HomeBranchesCta.vue')).default
  return mount(HomeBranchesCta, { global: { stubs } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('HomeBranchesCta', () => {
  it('renders the "más de 30 sucursales" title in ES', async () => {
    expect((await mountCta(ES)).find('h2').text()).toBe(
      'Más de 30 sucursales en CDMX, EDOMEX y Cuernavaca'
    )
  })

  it('renders the "30+ locations" title in EN', async () => {
    expect((await mountCta(EN)).find('h2').text()).toBe(
      '30+ locations across CDMX, EDOMEX and Cuernavaca'
    )
  })

  it('links the branches control to /branches', async () => {
    const links = (await mountCta()).findAllComponents(RouterLinkStub)
    expect(links.map(l => l.props('to'))).toContain('/branches')
  })

  it('links the reserve control to /reserve', async () => {
    const links = (await mountCta()).findAllComponents(RouterLinkStub)
    expect(links.map(l => l.props('to'))).toContain('/reserve')
  })

  it('renders two links (find branch and reserve)', async () => {
    const links = (await mountCta()).findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(2)
  })
})
