import type { Preview } from '@storybook/vue3'
import { type App, type Component, h, ref } from 'vue'
import '../app/assets/css/base.css'
import en from '../i18n/locales/en.json'
import es from '../i18n/locales/es.json'

// Globally register the auto-imported UI primitives so feature/layout
// components (which reference `<UiNav>`, `<UiButton>`, ... without explicit
// imports per Nuxt auto-import) render correctly inside Storybook.
const uiModules = import.meta.glob<{ default: Component }>(
  '../app/components/ui/*.vue',
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
globals.useRoute = () => ({ path: '/' })
globals.useReservationModal = () => ({
  isOpen: ref(false),
  openReservation: () => {},
  closeReservation: () => {},
})

// Stub NuxtLink as a plain anchor so navigation-based stories render.
const NuxtLink = {
  props: { to: { type: [String, Object], default: '#' } },
  setup(props: { to: unknown }, ctx: { slots: { default?: () => unknown } }) {
    return () => h('a', { href: String(props.to) }, ctx.slots.default?.())
  },
}

const preview: Preview = {
  setup(app: App) {
    app.component('NuxtLink', NuxtLink)
    for (const [path, mod] of Object.entries(uiModules)) {
      const base = path.split('/').pop()?.replace('.vue', '')
      if (base) app.component(`Ui${base}`, mod.default)
    }
  },
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
        mobile1: {
          name: 'Mobile (360px)',
          styles: { width: '360px', height: '720px' },
          type: 'mobile',
        },
        tablet: {
          name: 'Tablet (880px)',
          styles: { width: '880px', height: '1024px' },
          type: 'tablet',
        },
        desktop: {
          name: 'Desktop (1200px)',
          styles: { width: '1200px', height: '900px' },
          type: 'desktop',
        },
      },
      defaultViewport: 'desktop',
    },
  },
}

export default preview
