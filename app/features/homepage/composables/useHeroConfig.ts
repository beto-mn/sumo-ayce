import type { HeroConfig } from '@/types/content'

/**
 * Hero configuration sourced from runtime config (env-overridable via
 * NUXT_PUBLIC_HERO_PRICE), so the headline price is editable without a code
 * change. Defaults to "$269" (FR-007).
 */
export function useHeroConfig(): HeroConfig {
  const config = useRuntimeConfig()
  return { price: config.public.heroPrice }
}
