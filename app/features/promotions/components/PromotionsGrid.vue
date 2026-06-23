<script setup lang="ts">
import { computed } from 'vue'
import type { Promotion } from '@/types/content'

const props = withDefaults(
  defineProps<{
    promotions: Promotion[]
    ok?: boolean
  }>(),
  { ok: true }
)

const emit = defineEmits<{ 'open-lightbox': [imageUrl: string] }>()

const { t } = useI18n()

/** Show empty state when promotions array is empty or the upstream call failed. */
const isEmpty = computed(() => props.promotions.length === 0 || !props.ok)
</script>

<template>
  <div>
    <!-- Empty state -->
    <p
      v-if="isEmpty"
      data-testid="empty-state"
      class="py-12 text-center font-body text-soft"
    >
      {{ t('promotions.empty') }}
    </p>

    <!-- Promotion grid: 1 col < 520px, 2 cols 520–879px, 3 cols ≥ 880px -->
    <div
      v-else
      data-testid="promotions-grid"
      class="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
    >
      <UiPromotionCard
        v-for="promotion in promotions"
        :key="promotion.id"
        :promotion="promotion"
        @open-lightbox="url => emit('open-lightbox', url)"
      />
    </div>
  </div>
</template>
