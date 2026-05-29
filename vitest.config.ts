import { fileURLToPath } from 'node:url'
import { defineVitestConfig } from '@nuxt/test-utils/config'

export default defineVitestConfig({
  resolve: {
    alias: {
      '@/types': fileURLToPath(new URL('./types', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'server/**/*.test.ts'],
  },
})
