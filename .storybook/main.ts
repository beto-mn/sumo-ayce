import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { StorybookConfig } from '@storybook/vue3-vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from 'tailwindcss'

const require = createRequire(import.meta.url)

/**
 * PostCSS plugins for Storybook's Vite build. The project no longer ships a
 * root `postcss.config.cjs` (it triggered a "not supported together with Nuxt"
 * warning — Nuxt wires Tailwind/PostCSS itself via `@nuxtjs/tailwindcss`).
 * Storybook, however, still needs Tailwind processed for its component preview,
 * so we configure PostCSS INLINE here (which also disables Vite's search for a
 * postcss config file). Autoprefixer is added only when resolvable so a missing
 * transitive dep never breaks the Storybook build.
 */
function storybookPostcssPlugins(): unknown[] {
  const tailwindConfig = fileURLToPath(
    new URL('../tailwind.config.ts', import.meta.url)
  )
  const plugins: unknown[] = [tailwindcss(tailwindConfig)]
  try {
    const autoprefixer = require('autoprefixer') as (opts?: unknown) => unknown
    plugins.push(autoprefixer())
  } catch {
    // Autoprefixer is optional for the isolated component preview.
  }
  return plugins
}

const config: StorybookConfig = {
  stories: ['../app/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      // vue-docgen-api (regex-based) chokes on aliased `import type` paths
      // like `@/composables/maps/types`, logging spurious resolution errors.
      // vue-component-meta uses the TypeScript program (tsconfig `paths`),
      // so it resolves project aliases correctly.
      docgen: 'vue-component-meta',
    },
  },
  docs: {
    autodocs: true,
  },
  staticDirs: ['../public'],
  viteFinal: async config => {
    const plugins = config.plugins ?? []
    // `includeAbsolute: false` stops the Vue compiler from turning absolute
    // template asset URLs (e.g. `<img src="/brand/sumo-horizontal.svg">`,
    // served from `public/`) into ES imports. Storybook serves those files
    // raw with `image/svg+xml`, which the browser's ES module loader rejects,
    // breaking the dynamic import of any story that renders such a component
    // (e.g. SiteLogo). Leaving absolute URLs untouched keeps them as runtime
    // strings resolved against the static dir.
    plugins.push(
      vue({ template: { transformAssetUrls: { includeAbsolute: false } } })
    )
    config.plugins = plugins

    // Configure PostCSS inline (Tailwind) now that the root postcss.config.cjs
    // is gone. An explicit object also stops Vite from searching for a config
    // file. Merge into any existing css config Storybook may have set.
    config.css ??= {}
    config.css.postcss = { plugins: storybookPostcssPlugins() }

    config.resolve ??= {}

    // Storybook 10 uses array format for resolve.alias internally.
    // Spreading it as an object loses the existing entries. Normalize to
    // array first, then prepend our project aliases so they take priority
    // over any catch-all alias Storybook may have registered.
    const existing = Array.isArray(config.resolve.alias)
      ? config.resolve.alias
      : Object.entries(config.resolve.alias ?? {}).map(
          ([find, replacement]) => ({
            find,
            replacement: String(replacement),
          })
        )

    config.resolve.alias = [
      {
        find: '@/components',
        replacement: fileURLToPath(
          new URL('../app/components', import.meta.url)
        ),
      },
      {
        find: '@/composables',
        replacement: fileURLToPath(
          new URL('../app/composables', import.meta.url)
        ),
      },
      {
        find: '@/layouts',
        replacement: fileURLToPath(new URL('../app/layouts', import.meta.url)),
      },
      {
        find: '@/utils',
        replacement: fileURLToPath(new URL('../app/utils', import.meta.url)),
      },
      {
        find: '@/types',
        replacement: fileURLToPath(new URL('../types', import.meta.url)),
      },
      {
        find: '@/features',
        replacement: fileURLToPath(new URL('../app/features', import.meta.url)),
      },
      ...existing,
    ]

    return config
  },
}

export default config
