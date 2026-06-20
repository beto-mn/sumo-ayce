<script setup lang="ts">
import { computed } from 'vue'
import { useFeaturedDishes } from '@/features/homepage/composables/useFeaturedDishes'
import { useHeroConfig } from '@/features/homepage/composables/useHeroConfig'
import { usePromotions } from '@/features/homepage/composables/usePromotions'
import { REVIEWS } from '@/features/homepage/data/reviews'
import { selectPromotions } from '@/features/homepage/utils/select-promotions'

const { t } = useI18n()
const { price } = useHeroConfig()
const { dishes } = useFeaturedDishes()
const { promotions } = usePromotions()

const reviews = REVIEWS
// Defensive top-3 pass even though the route already filters/sorts/slices.
const topPromotions = computed(() => selectPromotions(promotions.value))

useSeoMeta({
  title: () => `SUMO · ${t('home.hero.headline')}`,
  description: () => t('home.hero.kicker'),
  ogTitle: () => `SUMO · ${t('home.hero.headline')}`,
  ogDescription: () => t('home.hero.kicker'),
})
</script>

<template>
  <div class="home flex flex-col gap-12 overflow-x-hidden [&>*]:min-w-0">
    <!-- Full-bleed cream-stripe hero; its inner content is centered. -->
    <HomeHero :price="price" />

    <!-- Centered content sections. -->
    <div
      class="home__sections container-pop flex flex-col gap-12 pb-4 min-w-0 w-full [&>*]:min-w-0"
    >
      <HomeTypeSelector />
      <HomeFeaturedRail :dishes="dishes" />
      <HomePromotions :promotions="topPromotions" />
      <HomeReviews :reviews="reviews" />
      <HomeBranchesCta />
    </div>
  </div>
</template>
