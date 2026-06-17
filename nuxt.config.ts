import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss', '@nuxtjs/i18n', '@nuxt/fonts'],
  css: ['~/assets/css/base.css', '~/assets/css/staff.css'],
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
    '/sucursales': { isr: 3600 },
    '/promociones': { isr: 60 },
    '/lealtad': { ssr: true },
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
    '@/layouts': fileURLToPath(new URL('./app/layouts', import.meta.url)),
    '@/server': fileURLToPath(new URL('./server', import.meta.url)),
    '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
  },
})
