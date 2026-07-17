import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Promotion } from '@/types/content'

// Stub Nuxt globals
vi.stubGlobal('useI18n', () => ({
  locale: { value: 'es' },
  t: (k: string) => k,
}))

import PromotionCard from './PromotionCard.vue'

const stubs = {
  UiSticker: {
    props: ['tone', 'rotate'],
    template: '<span class="sticker-stub" :data-tone="tone"><slot /></span>',
  },
}

function makePromo(overrides: Partial<Promotion> = {}): Promotion {
  return {
    id: '1',
    badge: { es: 'Martes', en: 'Tuesday' },
    title: '2×1 en sushi',
    color: 'orange',
    type: 'ayce',
    active: true,
    publishedAt: '2026-06-01T00:00:00Z',
    imageDesktopUrl: 'https://cdn.test/desktop.jpg',
    imageTabletUrl: 'https://cdn.test/tablet.jpg',
    imageMovilUrl: 'https://cdn.test/movil.jpg',
    terms: null,
    ...overrides,
  }
}

const mountCard = (
  promotion: Promotion,
  props: Partial<{ flipped: boolean }> = {}
) =>
  mount(PromotionCard, {
    props: { promotion, ...props },
    global: { stubs },
  })

describe('PromotionCard (responsive slide)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── <picture> responsive sources ───────────────────────────────────────────
  it('renders a <picture> with mobile (≤520) and tablet (≤880) sources', () => {
    const wrapper = mountCard(makePromo())
    const sources = wrapper.findAll('source')
    expect(sources).toHaveLength(2)
    expect(sources[0]?.attributes('media')).toBe('(max-width: 520px)')
    expect(sources[0]?.attributes('srcset')).toBe('https://cdn.test/movil.jpg')
    expect(sources[1]?.attributes('media')).toBe('(max-width: 880px)')
    expect(sources[1]?.attributes('srcset')).toBe('https://cdn.test/tablet.jpg')
  })

  it('uses the desktop image as the baseline <img> src', () => {
    const wrapper = mountCard(makePromo())
    expect(
      wrapper.find('[data-testid="promotion-img"]').attributes('src')
    ).toBe('https://cdn.test/desktop.jpg')
  })

  it('falls back missing tablet/mobile sources to the desktop URL', () => {
    const wrapper = mountCard(
      makePromo({ imageTabletUrl: null, imageMovilUrl: null })
    )
    const sources = wrapper.findAll('source')
    expect(sources[0]?.attributes('srcset')).toBe(
      'https://cdn.test/desktop.jpg'
    )
    expect(sources[1]?.attributes('srcset')).toBe(
      'https://cdn.test/desktop.jpg'
    )
  })

  // ── alt text ────────────────────────────────────────────────────────────────
  it('sets the img alt to the decoded title', () => {
    const wrapper = mountCard(makePromo())
    expect(
      wrapper.find('[data-testid="promotion-img"]').attributes('alt')
    ).toBe('2×1 en sushi')
  })

  it('falls back to a generic alt when the title is empty', () => {
    const wrapper = mountCard(makePromo({ title: '   ' }))
    expect(
      wrapper.find('[data-testid="promotion-img"]').attributes('alt')
    ).toBe('promotions.imageAltFallback')
  })

  // ── no-image fallback ────────────────────────────────────────────────────────
  it('renders a no-image placeholder (not a broken img) when desktop is null', () => {
    const wrapper = mountCard(
      makePromo({
        imageDesktopUrl: null,
        imageTabletUrl: null,
        imageMovilUrl: null,
      })
    )
    expect(wrapper.find('[data-testid="promotion-picture"]').exists()).toBe(
      false
    )
    expect(wrapper.find('[data-testid="promotion-noimage"]').exists()).toBe(
      true
    )
  })

  // ── badge ────────────────────────────────────────────────────────────────────
  it('renders the badge text (ES locale)', () => {
    const wrapper = mountCard(makePromo())
    expect(wrapper.find('[data-testid="promotion-badge"]').text()).toContain(
      'Martes'
    )
  })

  it('drives the badge tone from the promotion color', () => {
    const wrapper = mountCard(makePromo({ color: 'pink' }))
    expect(
      wrapper.find('[data-testid="promotion-badge"]').attributes('data-tone')
    ).toBe('pink')
  })

  it('defaults the badge tone to orange for an unexpected color', () => {
    const wrapper = mountCard(
      makePromo({ color: 'rainbow' as Promotion['color'] })
    )
    expect(
      wrapper.find('[data-testid="promotion-badge"]').attributes('data-tone')
    ).toBe('orange')
  })

  // ── Type pill (branch scope), top-left ──────────────────────────────────────
  it('renders the type pill at the top-left with the AYCE label + orange fill', () => {
    const pill = mountCard(makePromo({ type: 'ayce' })).find(
      '[data-testid="promotion-type"]'
    )
    expect(pill.exists()).toBe(true)
    expect(pill.classes()).toContain('top-3')
    expect(pill.classes()).toContain('left-3')
    expect(pill.attributes('data-type')).toBe('ayce')
    expect(pill.text()).toBe('promotions.type.ayce')
    expect(pill.classes()).toContain('bg-orange')
  })

  it('colors the type pill blue and labels it EXPRESS for type=express', () => {
    const pill = mountCard(makePromo({ type: 'express', color: 'blue' })).find(
      '[data-testid="promotion-type"]'
    )
    expect(pill.attributes('data-type')).toBe('express')
    expect(pill.text()).toBe('promotions.type.express')
    expect(pill.classes()).toContain('bg-blue')
  })

  it('uses a two-tone orange→blue gradient + AYCE+EXPRESS label for type=all', () => {
    const pill = mountCard(makePromo({ type: 'all' })).find(
      '[data-testid="promotion-type"]'
    )
    expect(pill.attributes('data-type')).toBe('all')
    expect(pill.text()).toBe('promotions.type.all')
    expect(pill.classes()).toContain('from-orange')
    expect(pill.classes()).toContain('to-blue')
  })

  it('keeps a text label (not color-only) for accessibility', () => {
    const pill = mountCard(makePromo({ type: 'express' })).find(
      '[data-testid="promotion-type"]'
    )
    expect(pill.text().length).toBeGreaterThan(0)
  })

  it('keeps the WP color/day badge at the top-right (unmoved)', () => {
    const badge = mountCard(makePromo()).find('[data-testid="promotion-badge"]')
    expect(badge.classes()).toContain('top-3')
    expect(badge.classes()).toContain('right-3')
  })

  it('applies the express scope class for tipo=express', () => {
    const wrapper = mountCard(makePromo({ type: 'express', color: 'blue' }))
    expect(wrapper.find('[data-testid="promotion-card"]').classes()).toContain(
      'scope-express'
    )
  })

  // ── Full-bleed: image IS the slide, no card frame ───────────────────────────
  it('has NO card frame (no border/background/shadow) — image is full-bleed', () => {
    const card = mountCard(makePromo()).find('[data-testid="promotion-card"]')
    const classes = card.classes()
    expect(classes).not.toContain('border-pop')
    expect(classes).not.toContain('bg-panel')
    expect(classes).not.toContain('shadow-pop')
    expect(classes).not.toContain('rounded-pop')
  })

  it('renders the image full-width (w-full) with natural aspect (no object-cover)', () => {
    const img = mountCard(makePromo()).find('[data-testid="promotion-img"]')
    expect(img.classes()).toContain('w-full')
    expect(img.classes()).not.toContain('object-cover')
  })

  // ── Flip-to-terms (Part A) ──────────────────────────────────────────────────
  describe('flip-to-terms', () => {
    const terms = { es: 'Válido de lunes a jueves.', en: 'Valid Mon–Thu.' }

    it('does NOT render a back face when the promo has no terms', () => {
      const wrapper = mountCard(makePromo({ terms: null }))
      expect(wrapper.find('[data-testid="promotion-back"]').exists()).toBe(
        false
      )
    })

    it('renders a back face with the ES terms text when both languages are configured', () => {
      const wrapper = mountCard(makePromo({ terms }))
      const back = wrapper.find('[data-testid="promotion-back"]')
      expect(back.exists()).toBe(true)
      expect(back.text()).toContain('Válido de lunes a jueves.')
    })

    it('scales padding progressively: p-6 mobile, p-9 tablet (min-[520px]), p-12 desktop (min-[880px])', () => {
      const wrapper = mountCard(makePromo({ terms }))
      const back = wrapper.find('[data-testid="promotion-back"]')
      expect(back.classes()).toContain('p-6')
      expect(back.classes()).toContain('min-[520px]:p-9')
      expect(back.classes()).toContain('min-[880px]:p-12')
    })

    it('is NOT clickable (no cursor-pointer, no aria-label) when there are no terms', () => {
      const card = mountCard(makePromo({ terms: null })).find(
        '[data-testid="promotion-card"]'
      )
      expect(card.classes()).not.toContain('cursor-pointer')
      expect(card.attributes('aria-label')).toBeUndefined()
    })

    it('is clickable (cursor-pointer + aria-label) when both languages are configured', () => {
      const card = mountCard(makePromo({ terms })).find(
        '[data-testid="promotion-card"]'
      )
      expect(card.classes()).toContain('cursor-pointer')
      expect(card.attributes('aria-label')).toBe('promotions.terms.cardLabel')
    })

    it('emits "flip" when clicked and terms are present', async () => {
      const wrapper = mountCard(makePromo({ terms }))
      await wrapper.find('[data-testid="promotion-card"]').trigger('click')
      expect(wrapper.emitted('flip')).toHaveLength(1)
    })

    it('does NOT emit "flip" when clicked and there are no terms', async () => {
      const wrapper = mountCard(makePromo({ terms: null }))
      await wrapper.find('[data-testid="promotion-card"]').trigger('click')
      expect(wrapper.emitted('flip')).toBeUndefined()
    })

    it('rotates the flip-inner container 180deg when flipped=true', () => {
      const wrapper = mountCard(makePromo({ terms }), { flipped: true })
      const inner = wrapper.find('[data-testid="promotion-flip-inner"]')
      expect(inner.classes().join(' ')).toContain('[transform:rotateY(180deg)]')
    })

    it('does NOT rotate the flip-inner container when flipped=false', () => {
      const wrapper = mountCard(makePromo({ terms }), { flipped: false })
      const inner = wrapper.find('[data-testid="promotion-flip-inner"]')
      expect(inner.classes().join(' ')).not.toContain(
        '[transform:rotateY(180deg)]'
      )
    })

    // ── Reduced motion: cross-fade instead of a 3D rotate ─────────────────────
    describe('with prefers-reduced-motion: reduce', () => {
      const originalMatchMedia = window.matchMedia

      beforeEach(() => {
        window.matchMedia = vi.fn().mockReturnValue({ matches: true })
      })

      afterEach(() => {
        window.matchMedia = originalMatchMedia
      })

      it('never applies the 3D rotate transform, even when flipped=true', async () => {
        const wrapper = mountCard(makePromo({ terms }), { flipped: true })
        // `reducedMotion` is set inside onMounted; the resulting re-render is
        // scheduled on the next tick, not synchronous with mount().
        await wrapper.vm.$nextTick()
        const inner = wrapper.find('[data-testid="promotion-flip-inner"]')
        expect(inner.classes().join(' ')).not.toContain(
          '[transform:rotateY(180deg)]'
        )
      })

      it('cross-fades the back face to full opacity when flipped=true', async () => {
        const wrapper = mountCard(makePromo({ terms }), { flipped: true })
        await wrapper.vm.$nextTick()
        const back = wrapper.find('[data-testid="promotion-back"]')
        expect(back.classes()).toContain('opacity-100')
      })

      it('keeps the back face hidden (opacity-0) when flipped=false', async () => {
        const wrapper = mountCard(makePromo({ terms }), { flipped: false })
        await wrapper.vm.$nextTick()
        const back = wrapper.find('[data-testid="promotion-back"]')
        expect(back.classes()).toContain('opacity-0')
      })
    })
  })
})
