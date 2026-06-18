<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-ink">
    <UiNav />
    <main class="container-pop flex-1 py-8">
      <slot />
    </main>
    <footer
      class="mt-12 border-t-[3px] border-ink bg-bg2 py-6 text-center text-soft"
    >
      <p class="font-disp text-kicker uppercase">
        SUMO · {{ t('brand.tagline') }}
      </p>
    </footer>
  </div>
</template>
