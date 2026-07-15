<script setup lang="ts">
import { computed } from 'vue'
import { pickLocale } from '@/features/homepage/utils/bilingual'
import type { FeaturedDish } from '@/types/content'

const props = defineProps<{ dish: FeaturedDish }>()

const { t, locale } = useI18n()
const localePath = useLocalePath()

const description = computed(() =>
  pickLocale(props.dish.description, locale.value)
)

/**
 * Deep link to /menu with the filters pre-filled from the dish's DB fields —
 * fully data-driven, so any future featured dish links correctly with no config:
 *   - express      → type=express&category=<key>
 *   - ayce / both  → type=ayce&modality=<buffet|carta>&category=<key>
 * The /menu page (feature 021) restores type+modality+category and scrolls to
 * the category on load.
 */
const menuLink = computed(() => {
  const params = new URLSearchParams()
  if (props.dish.locationType === 'express') {
    params.set('type', 'express')
  } else {
    params.set('type', 'ayce')
    params.set('modality', props.dish.includedInAyce ? 'buffet' : 'carta')
  }
  params.set('category', props.dish.category)
  return `${localePath('/menu')}?${params.toString()}`
})

const openLabel = computed(() =>
  t('home.featured.openLabel', { name: props.dish.name })
)
</script>

<template>
  <NuxtLink
    :to="menuLink"
    :aria-label="openLabel"
    class="block h-full no-underline"
  >
    <UiCard
      class="dish-card flex h-full w-[78vw] max-w-[260px] flex-col gap-3 transition-transform duration-150 min-[520px]:w-[230px] motion-reduce:transition-none hover:-translate-y-1 hover:-rotate-1 motion-reduce:hover:translate-y-0 motion-reduce:hover:rotate-0"
      tone="panel"
      shadow-size="sm"
    >
      <div
        class="relative h-44 rounded-pop-sm border-pop border-ink bg-bg2 p-4"
      >
        <img
          v-if="dish.imageUrl"
          class="block h-full w-full object-contain"
          :src="dish.imageUrl"
          :alt="dish.name"
          loading="lazy"
          decoding="async"
          width="320"
          height="240"
        />
        <div
          v-else
          class="flex h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <span class="font-disp font-extrabold uppercase text-placeholder text-soft"
            >SUMO</span
          >
        </div>
        <UiSticker
          v-if="dish.badge"
          class="absolute right-2 top-2"
          tone="pink"
          :rotate="-6"
        >
          {{ dish.badge }}
        </UiSticker>
      </div>
      <h3 class="font-disp font-extrabold uppercase text-dish-title">
        {{ dish.name }}
      </h3>
      <!-- flex-1 keeps equal-height; line-clamp-2 caps the description at two
           lines so cards stay short + uniform. Content stays top-aligned. -->
      <p class="line-clamp-2 flex-1 text-soft">{{ description }}</p>
    </UiCard>
  </NuxtLink>
</template>
