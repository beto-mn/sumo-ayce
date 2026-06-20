<script setup lang="ts"></script>

<template>
  <div class="min-h-screen flex flex-col bg-bg text-ink [&>*]:min-w-0">
    <SiteHeader />
    <SiteMarquee />
    <main class="flex-1">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>
