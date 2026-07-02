import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ES: Record<string, string> = {
  'home.typeSelector.kicker': 'AYCE - EXPRESS',
  'home.typeSelector.title': 'Dos experiencias, la misma garantía Sumo.',
  'home.typeSelector.cta': 'Ver menú',
  'home.typeSelector.ayce.name': 'All You Can Eat',
  'home.typeSelector.ayce.badge': 'AYCE',
  'home.typeSelector.ayce.desc':
    'La experiencia completa para disfrutar sin límites: buffet, variedad de platillos a la carta y el sabor sumo que ya conoces.',
  'home.typeSelector.express.name': 'Express',
  'home.typeSelector.express.badge': 'Express',
  'home.typeSelector.express.desc':
    'La opción práctica y rápida para disfrutar tus favoritos de Sumo de forma más ágil, sin perder sabor ni calidad (con platillos exclusivos).',
}

const EN: Record<string, string> = {
  'home.typeSelector.kicker': 'AYCE - EXPRESS',
  'home.typeSelector.title': 'Two experiences, the same Sumo guarantee.',
  'home.typeSelector.cta': 'See menu',
  'home.typeSelector.ayce.name': 'All You Can Eat',
  'home.typeSelector.ayce.badge': 'AYCE',
  'home.typeSelector.ayce.desc':
    'The complete experience to enjoy without limits: buffet, a variety of à la carte dishes and the Sumo flavor you already know.',
  'home.typeSelector.express.name': 'Express',
  'home.typeSelector.express.badge': 'Express',
  'home.typeSelector.express.desc':
    'The quick, practical option to enjoy your Sumo favorites in a nimbler way, without losing flavor or quality (with exclusive dishes).',
}

function stubLocale(map: Record<string, string>) {
  vi.stubGlobal('useI18n', () => ({
    t: (key: string) => map[key] ?? key,
    tm: (key: string) =>
      key.endsWith('.chips') ? ['All You Can Eat', 'A la carta'] : [],
    rt: (entry: string) => entry,
  }))
  vi.stubGlobal('useLocalePath', () => (path: string) => path)
}

const stubs = {
  UiCard: {
    props: ['accent'],
    template: '<div class="card-stub" :data-accent="accent"><slot /></div>',
  },
  UiKicker: { template: '<span class="kicker-stub"><slot /></span>' },
  UiSticker: { template: '<span class="badge-stub"><slot /></span>' },
  UiChip: { template: '<span class="chip-stub"><slot /></span>' },
  UiButton: { template: '<button><slot /></button>' },
  NuxtLink: RouterLinkStub,
}

async function mountSelector(map = ES) {
  stubLocale(map)
  const HomeTypeSelector = (await import('./HomeTypeSelector.vue')).default
  return mount(HomeTypeSelector, { global: { stubs } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('HomeTypeSelector', () => {
  it('renders exactly two type cards', async () => {
    expect((await mountSelector()).findAll('.card-stub')).toHaveLength(2)
  })

  it('shows the "AYCE - EXPRESS" kicker and the new section title (ES)', async () => {
    const text = (await mountSelector(ES)).text()
    expect(text).toContain('AYCE - EXPRESS')
    expect(text).toContain('Dos experiencias, la misma garantía Sumo.')
  })

  it('shows the new section title (EN)', async () => {
    expect((await mountSelector(EN)).text()).toContain(
      'Two experiences, the same Sumo guarantee.'
    )
  })

  it('reads "All You Can Eat" as the prominent AYCE card title', async () => {
    const titles = (await mountSelector()).findAll('h3').map(h => h.text())
    expect(titles).toContain('All You Can Eat')
  })

  it('reads "Express" as the prominent Express card title', async () => {
    const titles = (await mountSelector()).findAll('h3').map(h => h.text())
    expect(titles).toContain('Express')
  })

  it('renders the new AYCE and Express descriptions (ES)', async () => {
    const text = (await mountSelector(ES)).text()
    expect(text).toContain('La experiencia completa para disfrutar sin límites')
    expect(text).toContain('La opción práctica y rápida')
  })

  it('renders the new AYCE and Express descriptions (EN)', async () => {
    const text = (await mountSelector(EN)).text()
    expect(text).toContain('The complete experience to enjoy without limits')
    expect(text).toContain('The quick, practical option')
  })

  it('links the AYCE card to /menu?type=ayce', async () => {
    const targets = (await mountSelector())
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/menu?type=ayce')
  })

  it('links the Express card to /menu?type=express', async () => {
    const targets = (await mountSelector())
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/menu?type=express')
  })

  it('uses the orange accent for AYCE and blue (express) for Express', async () => {
    const accents = (await mountSelector())
      .findAll('.card-stub')
      .map(c => c.attributes('data-accent'))
    expect(accents).toContain('ayce')
    expect(accents).toContain('express')
  })

  it('renders a badge and at least one chip per card', async () => {
    const wrapper = await mountSelector()
    expect(wrapper.findAll('.badge-stub').length).toBe(2)
    expect(wrapper.findAll('.chip-stub').length).toBeGreaterThanOrEqual(2)
  })
})
