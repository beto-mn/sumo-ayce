import { fileURLToPath } from 'node:url'
import { getVitestConfigFromNuxt } from '@nuxt/test-utils/config'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const typesAlias = {
  '@/types': fileURLToPath(new URL('./types', import.meta.url)),
  '@/utils': fileURLToPath(new URL('./app/utils', import.meta.url)),
  '@/components': fileURLToPath(new URL('./app/components', import.meta.url)),
  '@/composables': fileURLToPath(new URL('./app/composables', import.meta.url)),
  '@/features': fileURLToPath(new URL('./app/features', import.meta.url)),
}

const excludedNuxtPlugins = new Set([
  // expects rollupOptions.input which we don't provide in test mode
  'ssr-styles',
  // we attach @vitejs/plugin-vue to the app project explicitly; the server
  // project doesn't need Vue compilation.
  'vite:vue',
  'vite:vue-jsx',
])

export default defineConfig(async () => {
  const nuxtConfig = await getVitestConfigFromNuxt()
  const filteredServerPlugins = (nuxtConfig.plugins ?? [])
    .flat()
    .filter(plugin => {
      if (!plugin || typeof plugin !== 'object') {
        return false
      }
      const name = 'name' in plugin ? plugin.name : undefined
      return name ? !excludedNuxtPlugins.has(name) : true
    })
  const serverResolve = {
    ...(nuxtConfig.resolve ?? {}),
    alias: {
      ...(nuxtConfig.resolve?.alias ?? {}),
      ...typesAlias,
    },
  }
  return {
    resolve: { alias: typesAlias },
    test: {
      projects: [
        {
          plugins: [vue()],
          resolve: { alias: typesAlias },
          test: {
            name: 'app',
            include: ['app/**/*.spec.ts', 'app/**/*.test.ts'],
            environment: 'happy-dom',
          },
        },
        {
          resolve: serverResolve,
          plugins: filteredServerPlugins,
          define: nuxtConfig.define,
          optimizeDeps: nuxtConfig.optimizeDeps,
          test: {
            name: 'server',
            include: ['tests/**/*.test.ts', 'server/**/*.test.ts'],
            environment: 'node',
            server: nuxtConfig.test?.server,
            deps: nuxtConfig.test?.deps,
          },
        },
      ],
    },
  }
})
