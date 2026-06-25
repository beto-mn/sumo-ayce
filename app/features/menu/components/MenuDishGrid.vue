<script setup lang="ts">
import type {
  FullMenuCategory,
  FullMenuSauce,
  MenuModality,
} from '@/types/menu'

defineProps<{
  categories: FullMenuCategory[]
  sauces: FullMenuSauce[]
  modality: MenuModality
}>()

const { t, locale } = useI18n()

function categoryLabel(key: string): string {
  const i18nKey = `menu.category.${key}`
  return t(i18nKey)
}

function categoryName(category: FullMenuCategory): string {
  return category.name[locale.value as 'es' | 'en'] ?? category.name.es
}
</script>

<template>
  <div class="flex flex-col gap-12">
    <section
      v-for="category in categories"
      :id="category.key"
      :key="category.key"
      class="scroll-mt-24"
    >
      <h2 class="mb-6 font-disp font-extrabold uppercase text-h-lg">
        {{ categoryLabel(category.key) || categoryName(category) }}
      </h2>
      <p v-if="category.dishes.length === 0" class="text-soft">
        {{ t('menu.category.empty') }}
      </p>
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
      >
        <MenuDishCard
          v-for="dish in category.dishes"
          :key="dish.id"
          :dish="dish"
          :sauces="sauces"
          :modality="modality"
        />
      </div>
    </section>
  </div>
</template>
