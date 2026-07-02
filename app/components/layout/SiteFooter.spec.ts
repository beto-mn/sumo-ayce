import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

const ES: Record<string, string> = {
  'footer.brand.tagline': 'Buffet preparado al instante',
  'footer.brand.blurb':
    'Sumo All You Can Eat es el buffet en donde encontrarás sushi, alitas, hamburguesas, ramen y mucho más, todo preparado al instante y con una gran variedad de bebidas y promociones para ofrecer una experiencia llena de sabor, variedad y diversión, tú eliges si es en familia, con amigos o en pareja.',
  'footer.contact.whatsapp': 'WhatsApp',
}

const EN: Record<string, string> = {
  'footer.brand.tagline': 'Buffet made to order',
  'footer.brand.blurb':
    "Sumo All You Can Eat is the buffet where you'll find sushi, wings, burgers, ramen and much more, all made to order and with a great variety of drinks and promotions for an experience full of flavor, variety and fun — you choose whether it's with family, friends or your partner.",
  'footer.contact.whatsapp': 'WhatsApp',
}

function stubLocale(map: Record<string, string>) {
  vi.stubGlobal('useI18n', () => ({ t: (key: string) => map[key] ?? key }))
  vi.stubGlobal('useLocalePath', () => (p: string) => p)
}

// Real SiteLogo mounted so we can assert the footer still uses the unmodified
// horizontal lockup (FR-009). NuxtLink is stubbed for both components.
const stubs = {
  UiKicker: { template: '<span class="kicker-stub"><slot /></span>' },
  NuxtLink: RouterLinkStub,
}

async function mountFooter(props: Record<string, unknown> = {}, map = ES) {
  stubLocale(map)
  const SiteFooter = (await import('./SiteFooter.vue')).default
  const SiteLogo = (await import('./SiteLogo.vue')).default
  return mount(SiteFooter, {
    props,
    global: { stubs, components: { SiteLogo } },
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('SiteFooter', () => {
  it('renders a footer landmark', async () => {
    expect((await mountFooter()).find('footer').exists()).toBe(true)
  })

  it('keeps the unmodified horizontal logo (nav/footer logo unchanged)', async () => {
    const img = (await mountFooter()).find('img')
    expect(img.attributes('src')).toBe('/brand/sumo-horizontal.svg')
  })

  it('renders the new tagline and blurb in ES', async () => {
    const text = (await mountFooter({}, ES)).text()
    expect(text).toContain('Buffet preparado al instante')
    expect(text).toContain('Sumo All You Can Eat es el buffet')
  })

  it('renders the new tagline and blurb in EN', async () => {
    const text = (await mountFooter({}, EN)).text()
    expect(text).toContain('Buffet made to order')
    expect(text).toContain('Sumo All You Can Eat is the buffet')
  })

  it('renders the five navigation links pointing at header routes', async () => {
    const targets = (await mountFooter())
      .findAllComponents(RouterLinkStub)
      .map(l => l.props('to'))
    expect(targets).toContain('/')
    expect(targets).toContain('/menu')
    expect(targets).toContain('/promotions')
    expect(targets).toContain('/branches')
    expect(targets).toContain('/contact')
  })

  it('renders the three external social links with real hrefs (no placeholders)', async () => {
    const anchors = (await mountFooter()).findAll('a[target="_blank"]')
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

  it('links the Contacto column to the contact page internally', async () => {
    const contactLink = (await mountFooter())
      .findAllComponents(RouterLinkStub)
      .find(l => l.text() === 'WhatsApp')
    expect(contactLink).toBeDefined()
    expect(contactLink?.props('to')).toBe('/contact')
  })

  it('exposes three labelled nav landmarks (navegación + redes + contacto)', async () => {
    const navs = (await mountFooter()).findAll('nav[aria-label]')
    expect(navs.length).toBe(3)
  })

  it('renders the provided copyright year', async () => {
    expect((await mountFooter({ year: 2031 })).text()).toContain(
      '© SUMO AYCE 2031'
    )
  })
})
