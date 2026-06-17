/**
 * @nuxtjs/i18n runtime configuration.
 * Locale list, defaultLocale, and routing strategy live in nuxt.config.ts.
 */
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'es',
  fallbackLocale: 'es',
  missingWarn: true,
  fallbackWarn: false,
}))
