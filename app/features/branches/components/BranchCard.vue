<script setup lang="ts">
import { computed } from 'vue'
import type { SortedBranch } from '../types'

const props = defineProps<{
  branch: SortedBranch
  highlighted?: boolean
  reserveLink?: string
}>()

const emit = defineEmits<{
  call: [phone: string]
}>()

const { t } = useI18n()
const localePath = useLocalePath()

const directionsUrl = computed(
  () =>
    `https://www.google.com/maps/dir/?api=1&destination=${props.branch.lat},${props.branch.lng}`
)

// Derive a weekday slot (Mon–Fri) and weekend slot (Sat–Sun) from per-day schedule
const weekdaySlot = computed(() => {
  const s = props.branch.schedule
  if (!s) return null
  return s.mon ?? s.tue ?? s.wed ?? s.thu ?? s.fri ?? null
})

const weekendSlot = computed(() => {
  const s = props.branch.schedule
  if (!s) return null
  return s.sat ?? s.sun ?? null
})

const resolvedReserveLink = computed(
  () =>
    props.reserveLink ??
    localePath(`/reserve?branch=${props.branch.id}&type=${props.branch.type}`)
)

function onCall() {
  if (props.branch.phone) emit('call', props.branch.phone)
}
</script>

<template>
  <article
    data-testid="branch-card"
    :aria-label="branch.name"
    :class="[
      'cursor-pointer rounded-pop border-pop border-ink bg-panel p-5 shadow-pop-sm transition-all duration-150',
      highlighted
        ? branch.type === 'express'
          ? 'ring-4 ring-blue ring-offset-2'
          : 'ring-4 ring-orange ring-offset-2'
        : '',
    ]"
  >
    <!-- Type chip -->
    <div class="mb-2">
      <span
        data-testid="type-chip"
        :class="[
          'inline-flex items-center rounded-pop-full px-3 py-1 font-disp font-extrabold text-kicker text-white',
          branch.type === 'express' ? 'scope-express bg-accent' : 'bg-accent',
        ]"
      >
        {{ t(`branches.type.${branch.type}`) }}
      </span>
    </div>

    <h3 class="mb-1 font-disp text-h3 font-extrabold text-ink">
      {{ branch.name }}
    </h3>
    <p class="font-body text-sm text-soft">{{ branch.address }}</p>

    <!-- Schedule summary -->
    <div class="mt-1 font-body text-xs text-soft">
      <template v-if="branch.schedule && (weekdaySlot || weekendSlot)">
        <span v-if="weekdaySlot">
          {{ t('branches.card.weekdays') }} {{ weekdaySlot.open }}–{{ weekdaySlot.close }}
        </span>
        <span v-if="weekdaySlot && weekendSlot"> · </span>
        <span v-if="weekendSlot">
          {{ t('branches.card.weekends') }} {{ weekendSlot.open }}–{{ weekendSlot.close }}
        </span>
      </template>
      <span v-else>{{ t('branches.card.hoursUnavailable') }}</span>
    </div>

    <!-- Distance (only when available) -->
    <p
      v-if="branch.distanceKm !== undefined"
      data-testid="distance"
      class="mt-1 font-body text-sm font-semibold text-ink"
    >
      {{ t('branches.card.distance', { km: branch.distanceKm }) }}
    </p>

    <!-- Actions -->
    <div class="mt-4 flex flex-wrap gap-2">
      <NuxtLink
        data-testid="reserve-button"
        :to="resolvedReserveLink"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pop-full border-pop border-ink bg-accent px-5 py-2 font-disp font-extrabold text-sm text-white shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop no-underline"
      >
        {{ t('branches.card.reserve') }}
      </NuxtLink>

      <a
        data-testid="directions-button"
        :href="directionsUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pop-full border-pop border-ink bg-panel px-5 py-2 font-disp font-extrabold text-sm text-ink shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop"
      >
        {{ t('branches.card.directions') }}
      </a>

      <a
        v-if="branch.phone"
        data-testid="call-button"
        :href="`tel:${branch.phone}`"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pop-full border-pop border-ink bg-panel px-5 py-2 font-disp font-extrabold text-sm text-ink shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop"
        @click.prevent="onCall"
      >
        {{ t('branches.card.call') }}
      </a>
    </div>
  </article>
</template>
