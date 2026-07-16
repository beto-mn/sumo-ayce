import type { Config } from 'tailwindcss'

/**
 * Mercado Pop design tokens.
 *
 * `theme.colors` is OVERRIDDEN (not extended): Tailwind's default palette
 * (`slate-*`, `gray-*`, `red-*`, etc.) is intentionally NOT generated. The
 * only non-token color names preserved are `transparent` and `currentColor`.
 *
 * Adding a new color requires (a) declaring it on :root in
 * `app/assets/css/tokens.css` and (b) adding the same name to this map.
 *
 * Source of truth: `docs/business/overview.md` §2.
 */
export default {
  content: [
    './app/**/*.{vue,js,ts}',
    './.storybook/**/*.{ts,js,vue}',
    './i18n/**/*.{json,ts}',
  ],
  // Restrict `hover:` variants to devices that actually support hover (i.e.
  // desktop pointers). On touch tablets/phones the `hover:` styles never apply,
  // so cards/links/buttons don't get stuck in a hovered state after a tap.
  future: {
    hoverOnlyWhenSupported: true,
  },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      // Colors consume the tokens as RGB channels so Tailwind's opacity
      // modifier (`bg-orange/50`) compiles to `rgb(var(--orange) / 0.5)`.
      // Reference: https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables
      bg: 'rgb(var(--bg) / <alpha-value>)',
      bg2: 'rgb(var(--bg2) / <alpha-value>)',
      panel: 'rgb(var(--panel) / <alpha-value>)',
      ink: 'rgb(var(--ink) / <alpha-value>)',
      black: 'rgb(var(--black) / <alpha-value>)',
      soft: 'rgb(var(--soft) / <alpha-value>)',
      orange: 'rgb(var(--orange) / <alpha-value>)',
      blue: 'rgb(var(--blue) / <alpha-value>)',
      pink: 'rgb(var(--pink) / <alpha-value>)',
      yellow: 'rgb(var(--yellow) / <alpha-value>)',
      green: 'rgb(var(--green) / <alpha-value>)',
      line: 'rgb(var(--line) / <alpha-value>)',
      accent: 'rgb(var(--accent) / <alpha-value>)',
    },
    screens: {
      sm: '520px',
      md: '880px',
      lg: '1200px',
    },
    extend: {
      borderWidth: {
        pop: '3px',
        'pop-sm': '2.5px',
      },
      ringWidth: {
        pop: '3px',
      },
      borderRadius: {
        pop: 'var(--r)',
        'pop-sm': 'var(--r-sm)',
        'pop-full': '9999px',
      },
      boxShadow: {
        pop: 'var(--shadow)',
        'pop-sm': 'var(--shadow-sm)',
        // Deeper hard-offset shadow for the home type-selector hover lift.
        'pop-lg': '9px 9px 0 rgb(var(--ink))',
      },
      backgroundImage: {
        // Two-layer "Mercado Pop" hero backdrop: a single yellow dot in the
        // top-right corner over a diagonal cream/bg2 stripe pattern. Layered on
        // top of the cream `bg-bg` base color.
        'hero-pop':
          'radial-gradient(circle at 88% 12%, rgb(var(--yellow)) 0 70px, transparent 71px), repeating-linear-gradient(45deg, rgb(var(--bg2)) 0 22px, transparent 22px 44px)',
        // Sitewide low-opacity (~10-15%, pre-baked into the asset itself)
        // repeating pop-art watermark texture. Painted alongside `bg-bg` on
        // the root layout wrapper (two CSS layers on one element), never as
        // its own overlay `<div>` — see docs/business/overview.md and
        // specs/024-menu-image-refresh-express-branding/research.md R4.
        watermark: "url('/patterns/sumo-watermark.webp')",
      },
      maxWidth: {
        pop: 'var(--maxw)',
      },
      fontFamily: {
        disp: 'var(--disp)',
        body: 'var(--body)',
      },
      // Named type scale tied to the Mercado Pop reference. Fluid display sizes
      // (`h-xl`, `h-lg`, `lead`) plus a set of fixed sizes for the smaller
      // component-level type. All consumers use the named utility — no
      // arbitrary `text-[…px]` classes anywhere in `app/`.
      fontSize: {
        'h-xl': ['clamp(48px, 9vw, 108px)', { lineHeight: '0.86' }], // hero H1
        'h-lg': ['clamp(32px, 5vw, 60px)', { lineHeight: '1' }], // section H2
        lead: ['clamp(17px, 2vw, 20px)', { lineHeight: '1.5' }], // hero subtitle
        price: ['40px', { lineHeight: '0.9' }], // hero price sticker <b>
        'card-title': ['30px', { lineHeight: '1' }], // type-selector card H3
        placeholder: ['28px', { lineHeight: '1' }], // dish image fallback "SUMO"
        'promo-title': ['22px', { lineHeight: '1.1' }], // promo card H3
        'dish-title': ['20px', { lineHeight: '1.1' }], // dish card H3
        stars: ['18px', { lineHeight: '1' }], // review rating row
        body: ['17px', { lineHeight: '1.55' }], // body copy
        nav: ['15px', { lineHeight: '1' }], // header nav links
        kicker: ['13px', { lineHeight: '1' }], // kickers / labels
        'sticker-days': ['0.8em', { lineHeight: '1' }], // hero sticker fine print
        micro: ['9px', { lineHeight: '1' }],
      },
      // Seamless infinite marquee: the track holds the content duplicated x2
      // (width = 2 copies) and translates one full copy (-50%) to the left, so
      // the loop is invisible. Mirrors reference `@keyframes mq` / `.marq__t`.
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        marquee: 'marquee 24s linear infinite',
      },
    },
  },
  plugins: [],
} satisfies Config
