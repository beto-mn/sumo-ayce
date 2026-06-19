<script setup lang="ts">
import { computed } from 'vue'
import { useReservationModal } from '@/composables/useReservationModal'
import { cx } from '@/utils/cx'

/**
 * Global public navigation. Wraps the `UiNav` primitive, filling its `logo`,
 * `links`, and `actions` slots. Active route gets the orange-pill treatment;
 * the EN toggle switches locale; the Reservar button opens the (no-op-safe)
 * reservation modal intent.
 *
 * No real SUMO logo asset exists in the repo, so the logo is the shared
 * `SiteLogo` token-built badge (orange square, white "SUMO", ink "all you can
 * eat" bar), also reused by `SiteFooter`.
 */
const { t, locale } = useI18n()
const localePath = useLocalePath()
const switchLocalePath = useSwitchLocalePath()
const route = useRoute()
const { openReservation } = useReservationModal()

interface NavLink {
  key: string
  to: string
}

const links: NavLink[] = [
  { key: 'inicio', to: '/' },
  { key: 'menu', to: '/menu' },
  { key: 'promos', to: '/promociones' },
  { key: 'sucursales', to: '/sucursales' },
  { key: 'contacto', to: '/contacto' },
]

/** Resolve the localized path and compare against the current route. */
function isActive(to: string): boolean {
  const target = localePath(to)
  if (to === '/') return route.path === target
  return route.path === target || route.path.startsWith(`${target}/`)
}

function linkClasses(to: string): string {
  return cx(
    'inline-flex items-center rounded-pop-full px-[14px] py-[9px]',
    'font-disp font-bold text-nav no-underline',
    'transition-[background,transform] duration-150',
    isActive(to)
      ? 'bg-accent text-bg -rotate-2'
      : 'bg-transparent text-ink hover:bg-bg2 hover:-rotate-2'
  )
}

const otherLocale = computed(() => (locale.value === 'es' ? 'en' : 'es'))
</script>

<template>
  <UiNav>
    <template #logo>
      <SiteLogo :to="localePath('/')" :label="t('home.hero.logoAlt')" />
    </template>

    <template #links>
      <NuxtLink
        v-for="link in links"
        :key="link.key"
        :to="localePath(link.to)"
        :class="linkClasses(link.to)"
        :aria-current="isActive(link.to) ? 'page' : undefined"
      >
        {{ t(`nav.${link.key}`) }}
      </NuxtLink>
    </template>

    <template #actions>
      <NuxtLink
        :to="switchLocalePath(otherLocale)"
        class="inline-flex h-[42px] w-[46px] items-center justify-center rounded-pop-full border-pop border-ink bg-yellow text-ink font-disp font-extrabold text-sm no-underline transition-transform duration-150 hover:rotate-[6deg]"
        :aria-label="`Switch language to ${otherLocale.toUpperCase()}`"
      >
        {{ t('common.lang.toggle') }}
      </NuxtLink>
      <UiButton size="sm" @click="openReservation">
        {{ t('nav.reservar') }}
      </UiButton>
    </template>
  </UiNav>
</template>
