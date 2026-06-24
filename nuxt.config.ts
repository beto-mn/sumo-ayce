import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  app: {
    head: {
      link: [
        // SVG favicon = the official vertical SUMO logo (modern browsers).
        {
          rel: 'icon',
          type: 'image/svg+xml',
          href: '/brand/sumo-vertical.svg',
        },
        // PNG fallback (generated from the same logo) for browsers without
        // SVG-favicon support. The default Nuxt favicon.ico was removed.
        {
          rel: 'icon',
          type: 'image/png',
          sizes: '32x32',
          href: '/favicon-32x32.png',
        },
        {
          rel: 'apple-touch-icon',
          sizes: '180x180',
          href: '/apple-touch-icon.png',
        },
      ],
    },
  },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/fonts'],
  components: [
    // Shared primitives → `Ui` prefix (<UiButton>, <UiNav>, ...).
    { path: '~/components/ui', prefix: 'Ui' },
    // App shell → bare names (<SiteHeader>, <SiteFooter>, <SiteLogo>,
    // <SiteMarquee>). The `Site*` prefix is part of the file name, not a
    // directory prefix, so pathPrefix is disabled here.
    { path: '~/components/layout', pathPrefix: false },
    // Remaining app/components subdirs (e.g. staff/ → <StaffLoginForm>) keep
    // the default directory-prefixed scan.
    '~/components',
    // Auto-import feature components by bare name (HomeHero, DishCard, ...) so
    // vertical slices need no explicit imports in templates.
    { path: '~/features', pathPrefix: false, extensions: ['vue'] },
  ],
  // staff.css is intentionally NOT global — it ships a dark `body` theme that
  // would override the public cream `--bg`. It is loaded only by the `staff`
  // layout (and the layout-less login page) to scope the dark portal theme.
  css: ['~/assets/css/base.css'],
  runtimeConfig: {
    public: {
      // Hero price sticker — configurable without code change via
      // NUXT_PUBLIC_HERO_PRICE. Default "$269" (FR-007).
      heroPrice: '$269',
      // Mapbox public token — must start with pk. — set NUXT_PUBLIC_MAPBOX_ACCESS_TOKEN
      // in Vercel environment variables (Access tokens → Create a token).
      mapboxAccessToken: '',
    },
  },
  fonts: {
    families: [
      { name: 'Bricolage Grotesque', weights: [800], provider: 'google' },
      {
        name: 'Hanken Grotesk',
        weights: [400, 600, 700],
        provider: 'google',
      },
    ],
  },
  i18n: {
    vueI18n: './i18n.config.ts',
    locales: [
      { code: 'es', name: 'Español', file: 'es.json' },
      { code: 'en', name: 'English', file: 'en.json' },
    ],
    defaultLocale: 'es',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: false,
  },
  routeRules: {
    '/': { isr: 3600 },
    '/menu': { isr: 3600 },
    '/branches': { isr: 3600 },
    '/promotions': { isr: 60 },
    '/contact': { prerender: true },
    '/lealtad': { ssr: true },
    '/reserve': { ssr: true },
    '/staff/**': { ssr: true },
    '/api/**': {},
  },
  vite: {
    server: {
      allowedHosts: ['.ngrok-free.app'],
    },
  },
  alias: {
    '@/components': fileURLToPath(new URL('./app/components', import.meta.url)),
    '@/composables': fileURLToPath(
      new URL('./app/composables', import.meta.url)
    ),
    '@/features': fileURLToPath(new URL('./app/features', import.meta.url)),
    '@/layouts': fileURLToPath(new URL('./app/layouts', import.meta.url)),
    '@/server': fileURLToPath(new URL('./server', import.meta.url)),
    '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
  },
})
