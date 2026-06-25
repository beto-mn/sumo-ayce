<script setup lang="ts">
import type { FullMenuCategory } from '@/types/menu'

const props = defineProps<{
  categories: FullMenuCategory[]
  activeCategory: string | null
  hasDrinks?: boolean
  translationPrefix?: string
}>()

const emit = defineEmits<{
  'update:active-category': [key: string | null]
}>()

const { t } = useI18n()

function handleClick(key: string): void {
  emit('update:active-category', props.activeCategory === key ? null : key)
}
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <UiChip
      v-for="cat in categories"
      :key="cat.key"
      :active="activeCategory === cat.key"
      @click="handleClick(cat.key)"
    >
      {{ t(`${props.translationPrefix ?? 'menu.category'}.${cat.key}`) }}
    </UiChip>
    <UiChip
      v-if="hasDrinks"
      :active="activeCategory === 'drinks'"
      @click="handleClick('drinks')"
    >
      {{ t('menu.category.drinks') }}
    </UiChip>
  </div>
</template>
