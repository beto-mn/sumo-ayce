import { type Preview, setup } from '@storybook/vue3-vite'
import * as Vue from 'vue'
import { type App, type Component, h, ref } from 'vue'
import '../app/assets/css/tailwind.css'
import '../app/assets/css/base.css'
import en from '../i18n/locales/en.json'
import es from '../i18n/locales/es.json'

// Nuxt auto-imports Vue's reactivity/lifecycle APIs (ref, computed, reactive,
// watch, onMounted, ...) so components use them without an explicit import.
// Storybook has no such transform, so those identifiers resolve against the
// global scope. Expose the real Vue APIs there to mirror the auto-import;
// components that DO import from 'vue' explicitly are unaffected (local
// bindings shadow the globals).
Object.assign(globalThis, Vue)

// Globally register the auto-imported UI primitives so feature/layout
// components (which reference `<UiNav>`, `<UiButton>`, ... without explicit
// imports per Nuxt auto-import) render correctly inside Storybook.
const uiModules = import.meta.glob<{ default: Component }>(
  '../app/components/ui/*.vue',
  { eager: true }
)

// SiteLogo is auto-imported by Nuxt and rendered internally by SiteHeader and
// SiteFooter; without registering it here those stories render with a missing
// logo. Register ONLY SiteLogo — eagerly importing the other layout shells
// (SiteHeader/SiteFooter/SiteMarquee) at preview-init breaks the preview
// bundle, and they don't need global registration (their own stories import
// them directly).
const layoutModules = import.meta.glob<{ default: Component }>(
  '../app/components/layout/SiteLogo.vue',
  { eager: true }
)

// Menu feature components reference each other by BARE name via Nuxt's
// feature-component auto-import (nuxt.config.ts `components` config) — e.g.
// `MenuDishCard.vue` renders `<MenuSaucePicker>`, `MenuDishGrid.vue` renders
// `<MenuDishCard>`. Storybook has no such transform, so register the whole
// directory globally (bare filename, no prefix) the same way `ui/` is
// registered above, so composed menu stories render their real children
// instead of failing to resolve them.
const menuModules = import.meta.glob<{ default: Component }>(
  '../app/features/menu/components/*.vue',
  { eager: true }
)

type Messages = Record<string, unknown>
const locales: Record<string, Messages> = { es, en }
const currentLocale = ref<'es' | 'en'>('es')

function resolveKey(messages: Messages, key: string): string {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      messages
    )
  return typeof value === 'string' ? value : key
}

// Nuxt composable shims so feature components (which rely on Nuxt auto-imports)
// render in isolation inside Storybook. No Nuxt runtime is present here.
const globals = globalThis as Record<string, unknown>
function resolveArray(messages: Messages, key: string): unknown[] {
  const value = key
    .split('.')
    .reduce<unknown>(
      (acc, part) =>
        acc && typeof acc === 'object'
          ? (acc as Record<string, unknown>)[part]
          : undefined,
      messages
    )
  return Array.isArray(value) ? value : []
}

globals.useI18n = () => ({
  t: (key: string, params?: Record<string, unknown>) => {
    const raw = resolveKey(locales[currentLocale.value], key)
    return params
      ? raw.replace(/\{(\w+)\}/g, (_m, p) => String(params[p] ?? ''))
      : raw
  },
  // tm/rt power array-based message lookups (e.g. the marquee phrase list).
  tm: (key: string) => resolveArray(locales[currentLocale.value], key),
  rt: (value: unknown) => (typeof value === 'string' ? value : String(value)),
  locale: currentLocale,
})
globals.useRuntimeConfig = () => ({ public: { heroPrice: '$269' } })
globals.useLocalePath = () => (p: string) => p
globals.useSwitchLocalePath = () => (l: string) => `/${l}`
globals.useRoute = () => ({ path: '/', query: {} })
globals.useRouter = () => ({ replace: () => {} })
globals.useReservationModal = () => ({
  isOpen: ref(false),
  openReservation: () => {},
  closeReservation: () => {},
})

// Nuxt data-fetching primitives. Components (directly or via feature
// composables) call these during `setup()`; without a Nuxt runtime they are
// undefined, so `setup()` throws and the whole render fails with cryptic errors
// like `$setup.t is not a function`. Shim them with inert, safe defaults so
// components render an empty/loaded-empty state instead of crashing.
const asyncDataShim = () => ({
  data: ref(null),
  pending: ref(false),
  error: ref(null),
  status: ref('success'),
  refresh: async () => {},
  execute: async () => {},
  clear: () => {},
})
globals.useFetch = asyncDataShim
globals.useAsyncData = asyncDataShim
globals.$fetch = async () => ({ data: [] })
globals.useState = (_key: string, init?: () => unknown) =>
  ref(typeof init === 'function' ? init() : undefined)
globals.useNuxtApp = () => ({
  payload: { data: {} },
  static: { data: {} },
})

// Stub NuxtLink as a plain anchor so navigation-based stories render.
const NuxtLink = {
  props: { to: { type: [String, Object], default: '#' } },
  setup(props: { to: unknown }, ctx: { slots: { default?: () => unknown } }) {
    return () => h('a', { href: String(props.to) }, ctx.slots.default?.())
  },
}

// Stub NuxtImg as a plain img so image components render in Storybook.
const NuxtImg = {
  props: {
    src: String,
    alt: String,
    loading: String,
    width: [String, Number],
    height: [String, Number],
    class: String,
  },
  setup(props: Record<string, unknown>) {
    return () =>
      h('img', {
        src: props.src,
        alt: props.alt,
        loading: props.loading,
        width: props.width,
        height: props.height,
        class: props.class,
      })
  },
}

// Register global components on Storybook's Vue app. This MUST use the `setup`
// function exported by `@storybook/vue3-vite` — a `setup` key on the preview
// object is IGNORED, so components like `<UiNav>`, `<NuxtLink>`, `<SiteLogo>`
// referenced INSIDE composed components would fail to resolve and render blank.
setup((app: App) => {
  app.component('NuxtLink', NuxtLink)
  app.component('NuxtImg', NuxtImg)
  for (const [path, mod] of Object.entries(uiModules)) {
    const base = path.split('/').pop()?.replace('.vue', '')
    if (base) app.component(`Ui${base}`, mod.default)
  }
  for (const mod of Object.values(layoutModules)) {
    app.component('SiteLogo', mod.default)
  }
  for (const [path, mod] of Object.entries(menuModules)) {
    const base = path.split('/').pop()?.replace('.vue', '')
    if (base) app.component(base, mod.default)
  }
})

const preview: Preview = {
  decorators: [
    (story, context) => {
      currentLocale.value = (context.globals.locale as 'es' | 'en') ?? 'es'
      return { components: { story }, template: '<story />' }
    },
  ],
  globalTypes: {
    locale: {
      description: 'Active locale',
      defaultValue: 'es',
      toolbar: {
        title: 'Locale',
        icon: 'globe',
        items: [
          { value: 'es', title: 'Español' },
          { value: 'en', title: 'English' },
        ],
      },
    },
  },
  parameters: {
    backgrounds: {
      default: 'cream',
      values: [
        { name: 'cream', value: '#FFF7EC' },
        { name: 'cream2', value: '#FFE9D2' },
        { name: 'panel', value: '#FFFFFF' },
        { name: 'ink', value: '#1A1209' },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile (375px)',
          styles: { width: '375px', height: '812px' },
          type: 'mobile',
        },
        mobile1: {
          name: 'Mobile (360px)',
          styles: { width: '360px', height: '720px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (768px)',
          styles: { width: '768px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1280px)',
          styles: { width: '1280px', height: '900px' },
          type: 'desktop',
        },
      },
      defaultViewport: 'mobile',
    },
  },
}

export default preview
