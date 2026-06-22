<script setup lang="ts">
/**
 * Global public site footer rendered by the default layout (so it appears on
 * every public page; staff pages use the `staff` layout and are unaffected).
 *
 * Mercado Pop look: dark `ink` band with a `border-t-pop` ink top border and
 * token-only colors. Yellow `disp` column headings, `bg2` body links that turn
 * yellow on hover, original bare white logo (the white wordmark shows directly
 * on the dark band, no backing box).
 * Structured into Brand / Navegación / Síguenos / Contacto columns
 * (1.6fr 1fr 1fr 1.4fr on desktop, stacked on mobile) plus a bottom bar.
 *
 * The Síguenos column links out to the official SUMO social profiles. The
 * Contacto column links internally to the contact page (each branch has its
 * own WhatsApp number, surfaced there).
 */
interface SiteFooterProps {
  /**
   * Copyright year. Defaults to the current year; accepting it as a prop keeps
   * SSR output deterministic across renders/tests.
   */
  year?: number
}

const props = withDefaults(defineProps<SiteFooterProps>(), {
  year: () => new Date().getFullYear(),
})

const { t } = useI18n()
const localePath = useLocalePath()

interface FooterLink {
  key: string
  to: string
}

const navLinks: FooterLink[] = [
  { key: 'home', to: '/' },
  { key: 'menu', to: '/menu' },
  { key: 'promotions', to: '/promotions' },
  { key: 'branches', to: '/branches' },
  { key: 'contact', to: '/contact' },
]

interface SocialLink {
  key: 'instagram' | 'facebook' | 'tiktok'
  href: string
}

const socialLinks: SocialLink[] = [
  { key: 'instagram', href: 'https://www.instagram.com/sumo_allyoucaneat' },
  { key: 'facebook', href: 'https://www.facebook.com/sumoallyoucaneat' },
  { key: 'tiktok', href: 'https://www.tiktok.com/@sumooficial' },
]

const linkClass =
  'inline-flex items-center min-h-[28px] py-1 font-body text-bg2 no-underline hover:text-yellow focus-visible:outline-none focus-visible:text-yellow transition-colors duration-150'

const headingClass =
  'font-disp font-extrabold uppercase text-yellow text-kicker tracking-[0.1em]'
</script>

<template>
  <footer
    class="border-t-pop border-ink bg-ink text-bg"
    data-component="SiteFooter"
  >
    <div
      class="container-pop grid gap-6 py-8 grid-cols-1 min-[600px]:grid-cols-2 min-[880px]:grid-cols-[1.6fr_1fr_1fr_1.4fr] min-[880px]:py-12"
    >
      <!-- Brand -->
      <div class="flex flex-col gap-4">
        <!-- Bare logo on the ink footer: the white SUMO wordmark shows directly
             on the dark band; no backing box. -->
        <SiteLogo
          :to="localePath('/')"
          :label="t('home.hero.logoAlt')"
          class="self-start"
        />
        <p class="font-disp font-extrabold uppercase text-kicker text-bg">
          {{ t('footer.brand.tagline') }}
        </p>
        <p class="font-body text-bg2">{{ t('footer.brand.blurb') }}</p>
      </div>

      <!-- Navegación -->
      <nav class="flex flex-col gap-3" :aria-label="t('footer.nav.title')">
        <h4 :class="headingClass">{{ t('footer.nav.title') }}</h4>
        <ul
          class="flex flex-wrap gap-x-5 gap-y-1 min-[880px]:flex-col min-[880px]:gap-1"
        >
          <li v-for="link in navLinks" :key="link.key">
            <NuxtLink :to="localePath(link.to)" :class="linkClass">
              {{ t(`nav.${link.key}`) }}
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <!-- Síguenos / Redes -->
      <nav class="flex flex-col gap-3" :aria-label="t('footer.social.title')">
        <h4 :class="headingClass">{{ t('footer.social.title') }}</h4>
        <ul
          class="flex flex-wrap gap-x-5 gap-y-1 min-[880px]:flex-col min-[880px]:gap-1"
        >
          <li v-for="social in socialLinks" :key="social.key">
            <a
              :href="social.href"
              :class="linkClass"
              target="_blank"
              rel="noopener noreferrer"
            >
              {{ t(`footer.social.${social.key}`) }}
            </a>
          </li>
        </ul>
      </nav>

      <!-- Contacto -->
      <nav class="flex flex-col gap-3" :aria-label="t('footer.contact.title')">
        <h4 :class="headingClass">{{ t('footer.contact.title') }}</h4>
        <NuxtLink :to="localePath('/contact')" :class="linkClass">
          {{ t('footer.contact.whatsapp') }}
        </NuxtLink>
      </nav>
    </div>

    <!-- Bottom bar -->
    <div>
      <p
        class="container-pop pt-5 pb-5 font-body text-bg2 text-sm min-[880px]:pt-7 min-[880px]:pb-6"
      >
        © SUMO AYCE {{ props.year }} · {{ t('footer.legal.rights') }}
      </p>
    </div>
  </footer>
</template>
