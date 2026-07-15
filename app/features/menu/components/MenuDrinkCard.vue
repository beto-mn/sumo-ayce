<script setup lang="ts">
defineProps<{
  name: string
  description: string
  badge: string | null
  price: string | null
  imageUrl: string | null
}>()

const { t } = useI18n()
</script>

<template>
  <div class="relative flex flex-col gap-2 rounded-pop border-pop border-ink bg-panel p-4 shadow-pop-sm transition-transform duration-300 ease-out hover:z-10 hover:scale-105 motion-reduce:transform-none">
    <div
      v-if="imageUrl"
      class="relative h-44 overflow-hidden rounded-pop-sm border-pop-sm border-ink bg-accent/20 p-4"
    >
      <img
        class="block h-full w-full object-contain"
        :src="imageUrl"
        :alt="name"
        loading="lazy"
        decoding="async"
      />
    </div>
    <h4 class="font-disp font-extrabold uppercase text-dish-title">{{ name }}</h4>
    <p v-if="description" class="text-soft text-body">{{ description }}</p>
    <span v-if="badge" class="font-disp font-extrabold uppercase text-kicker text-soft">
      {{ badge }}
    </span>
    <span v-if="price" class="font-disp font-extrabold text-dish-title">
      {{ t('menu.dish.price_prefix') }}{{ price }}
    </span>
    <slot />
  </div>
</template>
