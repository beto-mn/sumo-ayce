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
      <!-- LEFT: copy -->
      <div class="flex flex-col items-start gap-[1.125rem]">
        <UiKicker tone="ink">{{ t('home.hero.kicker') }}</UiKicker>
        <h1
          class="m-0 font-disp font-extrabold uppercase leading-[0.86] tracking-[-0.02em] text-h-xl [overflow-wrap:anywhere] text-ink"
        >
          {{ t('home.hero.headline') }}
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
          <NuxtLink :to="localePath('/sucursales')" class="no-underline">
            <UiButton variant="ghost" size="lg">{{
              t('common.cta.viewBranches')
            }}</UiButton>
          </NuxtLink>
        </div>
      </div>

      <!-- RIGHT: tilted logo frame (transparent fill) + orange price sticker -->
      <div
        class="home-hero__art relative order-first mx-auto w-full max-w-[420px] md:order-none md:max-w-none"
      >
        <!-- Frame stays transparent: the SUMO vertical logo (with its own black
             sticker outline) sits on the cream/striped hero background. No black
             fill. -->
        <div
          class="flex aspect-square items-center justify-center overflow-hidden rounded-pop border-pop border-ink p-[18%] shadow-pop rotate-[2deg] motion-reduce:rotate-0"
        >
          <img
            class="block h-auto max-h-full w-auto max-w-full object-contain"
            src="/brand/sumo-vertical.svg"
            :alt="t('home.hero.logoAlt')"
          />
        </div>
        <div
          class="absolute bottom-[18px] left-[-18px] z-[4] flex flex-col items-center rounded-[18px] border-pop border-ink bg-orange px-[18px] py-[14px] text-center font-disp font-extrabold leading-[1.05] text-bg shadow-pop rotate-[-6deg] motion-reduce:rotate-0"
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
