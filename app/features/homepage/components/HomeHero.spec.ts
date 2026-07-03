import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ES: Record<string, string> = {
  'home.hero.headline': 'All You Can Eat',
  'home.hero.kicker': 'Come sin límites · Buffet preparado al instante',
  'home.hero.subtitle':
    'Más de 45 platillos por un solo precio... Descubre tu nuevo lugar favorito.',
  'home.hero.logoAlt': 'SUMO — All You Can Eat',
  'home.hero.stickerLabel': 'All You Can Eat',
  'home.hero.stickerDays': 'todos los días',
  'common.cta.viewMenu': 'Ver menú',
  'common.cta.viewBranches': 'Ver sucursales',
}

const EN: Record<string, string> = {
  'home.hero.headline': 'All You Can Eat',
  'home.hero.kicker': 'Eat without limits · Buffet made to order',
  'home.hero.subtitle':
    '45+ dishes for a single price... Discover your new favorite place.',
  'home.hero.logoAlt': 'SUMO — All You Can Eat',
  'home.hero.stickerLabel': 'All You Can Eat',
  'home.hero.stickerDays': 'every day',
  'common.cta.viewMenu': 'View menu',
  'common.cta.viewBranches': 'View branches',
}

function stubLocale(map: Record<string, string>) {
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => map[key] ?? key }))
  vi.stubGlobal('useLocalePath', () => (p: string) => p)
}

const stubs = {
  UiKicker: {
    props: ['tone'],
    template: '<span class="kicker-stub" :data-tone="tone"><slot /></span>',
  },
  UiButton: {
    props: ['variant'],
    template:
      '<button class="button-stub" :data-variant="variant"><slot /></button>',
  },
  NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
}

async function mountHero(map = ES, price = '$269') {
  stubLocale(map)
  const HomeHero = (await import('./HomeHero.vue')).default
  return mount(HomeHero, { props: { price }, global: { stubs } })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('HomeHero', () => {
  it('exposes the full headline phrase as the accessible name of the h1', async () => {
    const h1 = (await mountHero()).find('h1')
    expect(h1.exists()).toBe(true)
    // Screen readers read the sr-only full phrase; the visual split is aria-hidden.
    const srText = h1.find('.sr-only').text()
    expect(srText).toBe('All You Can Eat')
  })

  it('renders the headline as real text, not an image', async () => {
    const h1 = (await mountHero()).find('h1')
    expect(h1.find('img').exists()).toBe(false)
    expect(h1.text().toUpperCase()).toContain('ALL YOU')
    expect(h1.text().toUpperCase()).toContain('CAN EAT')
  })

  it('hides the presentational split lines from assistive tech', async () => {
    const lines = (await mountHero()).findAll('.hero-headline__line')
    expect(lines.length).toBe(2)
    lines.forEach(line => {
      expect(line.attributes('aria-hidden')).toBe('true')
    })
  })

  it('keeps the reduced-motion-safe static rotation classes on the split lines', async () => {
    const wrapper = await mountHero()
    expect(wrapper.find('.hero-headline__line--top').exists()).toBe(true)
    expect(wrapper.find('.hero-headline__line--bottom').exists()).toBe(true)
  })

  it('renders the new Spanish kicker and subtitle', async () => {
    const text = (await mountHero(ES)).text()
    expect(text).toContain('Come sin límites · Buffet preparado al instante')
    expect(text).toContain('Más de 45 platillos por un solo precio')
  })

  it('renders the new English kicker and subtitle', async () => {
    const text = (await mountHero(EN)).text()
    expect(text).toContain('Eat without limits · Buffet made to order')
    expect(text).toContain('45+ dishes for a single price')
  })

  it('swaps the hero-frame logo to the illustrated sumo.webp with the logo alt', async () => {
    const img = (await mountHero()).find('img')
    expect(img.attributes('src')).toBe('/brand/sumo.webp')
    expect(img.attributes('alt')).toBe('SUMO — All You Can Eat')
  })

  it('sets explicit width/height on the hero logo to avoid layout shift', async () => {
    const img = (await mountHero()).find('img')
    expect(img.attributes('width')).toBe('900')
    expect(img.attributes('height')).toBe('906')
  })

  it('renders the kicker with the ink tone (white-on-ink pill)', async () => {
    expect(
      (await mountHero()).find('.kicker-stub').attributes('data-tone')
    ).toBe('ink')
  })

  it('renders the configured price from the prop inside the sticker', async () => {
    expect((await mountHero(ES, '$269')).find('.bg-orange').text()).toContain(
      '$269'
    )
  })

  it('renders a different price when the prop changes (config-driven)', async () => {
    expect((await mountHero(ES, '$299')).find('.bg-orange').text()).toContain(
      '$299'
    )
  })

  it('links to the menu and branches pages', async () => {
    const hrefs = (await mountHero())
      .findAll('a')
      .map(a => a.attributes('href'))
    expect(hrefs).toContain('/menu')
    expect(hrefs).toContain('/branches')
  })

  it('does NOT render its own marquee (now a global band)', async () => {
    expect((await mountHero()).find('.marquee-stub').exists()).toBe(false)
  })
})
