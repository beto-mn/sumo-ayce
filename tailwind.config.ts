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
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      // Colors consume the tokens as RGB channels so Tailwind's opacity
      // modifier (`bg-orange/50`) compiles to `rgb(var(--orange) / 0.5)`.
      // Reference: https://v3.tailwindcss.com/docs/customizing-colors#using-css-variables
      bg: 'rgb(var(--bg) / <alpha-value>)',
      bg2: 'rgb(var(--bg2) / <alpha-value>)',
      panel: 'rgb(var(--panel) / <alpha-value>)',
      ink: 'rgb(var(--ink) / <alpha-value>)',
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
      },
      maxWidth: {
        pop: 'var(--maxw)',
      },
      fontFamily: {
        disp: 'var(--disp)',
        body: 'var(--body)',
      },
      fontSize: {
        'h-xl': ['clamp(48px, 9vw, 108px)', { lineHeight: '0.86' }],
        'h-lg': ['clamp(32px, 5vw, 60px)', { lineHeight: '1' }],
        body: ['17px', { lineHeight: '1.55' }],
        kicker: ['13px', { lineHeight: '1' }],
        micro: ['9px', { lineHeight: '1' }],
      },
    },
  },
  plugins: [],
} satisfies Config
