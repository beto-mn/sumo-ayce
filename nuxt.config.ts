import { fileURLToPath } from 'node:url'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/staff.css'],
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
    '@/utils': fileURLToPath(new URL('./utils', import.meta.url)),
  },
})
