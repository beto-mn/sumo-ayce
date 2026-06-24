<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
</script>

<template>
  <section class="w-full" :aria-label="t('home.branches.title')">
    <div
      class="flex flex-col gap-6 rounded-pop border-pop border-ink bg-ink p-8 text-bg shadow-pop md:flex-row md:items-center md:justify-between"
    >
      <div class="flex flex-col items-start gap-[0.875rem]">
        <UiKicker tone="orange">{{ t('home.branches.kicker') }}</UiKicker>
        <h2
          class="font-disp font-extrabold uppercase leading-none tracking-[-0.02em] text-h-lg text-bg"
        >
          {{ t('home.branches.title') }}
        </h2>
        <p class="m-0 font-body text-bg2">{{ t('home.branches.desc') }}</p>
      </div>
      <div class="flex flex-wrap gap-4">
        <NuxtLink :to="localePath('/branches')" class="no-underline">
          <UiButton variant="primary" size="lg">
            {{ t('home.branches.findBranch') }} →
          </UiButton>
        </NuxtLink>
        <NuxtLink :to="localePath('/reserve')" class="no-underline">
          <UiButton variant="ghost" size="lg">
            {{ t('home.branches.reserve') }}
          </UiButton>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
