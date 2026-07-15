<script setup lang="ts">
defineProps<{ price: string }>()

const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section
    class="home-hero relative overflow-hidden border-b-pop border-ink bg-bg bg-hero-pop"
    :aria-label="t('home.hero.headline')"
  >
    <div
      class="home-hero__inner container-pop grid grid-cols-1 items-center gap-[30px] py-[clamp(30px,5vw,64px)] md:grid-cols-[1.05fr_0.95fr]"
    >
      <!-- LEFT: copy — airier vertical rhythm between kicker, headline and subtitle -->
      <div class="flex flex-col items-start gap-8">
        <UiKicker tone="ink">{{ t('home.hero.kicker') }}</UiKicker>
        <!-- Real, selectable heading. The full phrase is exposed to screen
             readers via the sr-only span; the two staggered lines are a
             presentational split (aria-hidden). Graphik Super logo-style
             lettering (white fill + black stroke), tokens only — see
             .hero-headline in base.css. -->
        <h1 class="hero-headline">
          <span class="sr-only">{{ t('home.hero.headline') }}</span>
          <span
            class="hero-headline__line hero-headline__line--top"
            aria-hidden="true"
            >All You</span
          >
          <span
            class="hero-headline__line hero-headline__line--bottom"
            aria-hidden="true"
            >Can Eat</span
          >
        </h1>
        <p
          class="m-0 max-w-[54ch] font-body text-lead text-soft"
        >
          {{ t('home.hero.subtitle') }}
        </p>
        <div class="mt-2 flex flex-wrap gap-3">
          <NuxtLink :to="localePath('/menu')" class="no-underline">
            <UiButton variant="primary" size="lg">{{
              t('common.cta.viewMenu')
            }}</UiButton>
          </NuxtLink>
          <NuxtLink :to="localePath('/branches')" class="no-underline">
            <UiButton variant="ghost" size="lg">{{
              t('common.cta.viewBranches')
            }}</UiButton>
          </NuxtLink>
        </div>
      </div>

      <!-- RIGHT: frameless illustrated lockup + orange price sticker -->
      <div
        class="home-hero__art relative order-first mx-auto w-full max-w-[520px] md:order-none md:max-w-[620px]"
      >
        <!-- No frame: the client's illustrated three-sumos lockup (sumo.webp)
             sits directly on the cream/striped hero background (the box border
             clashed with the illustration). Hero frame ONLY — nav/footer keep
             sumo-horizontal.svg. Explicit width/height avoids CLS. -->
        <img
          class="block h-auto w-full object-contain"
          src="/brand/sumo.webp"
          :alt="t('home.hero.logoAlt')"
          width="900"
          height="906"
        />
        <!-- Orange price sticker: top-right corner, nestled between the two
             clouds in the upper-right of the illustration (clear of the sumo
             faces). Same style (orange, ink border, shadow, slight tilt). -->
        <div
          class="absolute top-[-2%] right-[7%] z-[4] flex flex-col items-center rounded-[20px] border-pop border-ink bg-orange px-[21px] py-[16px] text-center font-disp font-extrabold leading-[1.05] text-bg shadow-pop rotate-[-6deg] motion-reduce:rotate-0"
        >
          <span>{{ t('home.hero.stickerLabel') }}</span>
          <b class="block text-price">{{ price }}</b>
          <span class="text-sticker-days font-bold">{{
            t('home.hero.stickerDays')
          }}</span>
        </div>
      </div>
    </div>
  </section>
</template>
