import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import HomeHero from './HomeHero.vue'

vi.stubGlobal('useI18n', () => ({
  t: (key: string) => {
    const map: Record<string, string> = {
      'home.hero.headline': 'All You Can Eat',
      'home.hero.kicker': 'Come sin límites · Estilo americano-japonés',
      'home.hero.subtitle':
        'Rolls, ramen, teppanyaki y smash burgers — ilimitados por un precio fijo.',
      'home.hero.priceLabel': 'Desde',
      'home.hero.imageAlt': 'Selección de platillos SUMO All You Can Eat',
      'home.hero.logoAlt': 'SUMO — All You Can Eat',
      'home.hero.stickerLabel': 'All You Can Eat',
      'home.hero.stickerDays': 'todos los días',
      'common.cta.viewMenu': 'Ver menú',
      'common.cta.viewBranches': 'Ver sucursales',
    }
    return map[key] ?? key
  },
}))
vi.stubGlobal('useLocalePath', () => (p: string) => p)

const stubs = {
  UiKicker: {
    props: ['tone'],
    template: '<span class="kicker-stub" :data-tone="tone"><slot /></span>',
  },
  UiSticker: {
    props: ['tone'],
    template: '<span class="sticker-stub" :data-tone="tone"><slot /></span>',
  },
  UiButton: {
    props: ['variant'],
    template:
      '<button class="button-stub" :data-variant="variant"><slot /></button>',
  },
  NuxtLink: {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
  },
}

function mountHero(price = '$269') {
  return mount(HomeHero, { props: { price }, global: { stubs } })
}

describe('HomeHero', () => {
  it('renders the ALL YOU CAN EAT headline', () => {
    expect(mountHero().text().toUpperCase()).toContain('ALL YOU CAN EAT')
  })

  it('renders the Spanish kicker by default', () => {
    expect(mountHero().text()).toContain('Come sin límites')
    expect(mountHero().text()).toContain('Estilo americano-japonés')
  })

  it('renders the kicker with the ink tone (white-on-ink pill)', () => {
    expect(mountHero().find('.kicker-stub').attributes('data-tone')).toBe('ink')
  })

  it('renders the subtitle paragraph', () => {
    expect(mountHero().text()).toContain('Rolls, ramen')
  })

  it('renders the configured price from the prop inside the sticker', () => {
    // The price sticker is the orange (`bg-orange`) badge in the art column.
    expect(mountHero('$269').find('.bg-orange').text()).toContain('$269')
  })

  it('renders a different price when the prop changes (config-driven)', () => {
    expect(mountHero('$299').find('.bg-orange').text()).toContain('$299')
  })

  it('renders the orange price sticker element', () => {
    expect(mountHero().find('.bg-orange').exists()).toBe(true)
  })

  it('links to the menu and branches pages', () => {
    const hrefs = mountHero()
      .findAll('a')
      .map(a => a.attributes('href'))
    expect(hrefs).toContain('/menu')
    expect(hrefs).toContain('/sucursales')
  })

  it('does NOT render its own marquee (now a global band)', () => {
    expect(mountHero().find('.marquee-stub').exists()).toBe(false)
  })
})
