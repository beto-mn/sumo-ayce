<script setup lang="ts">
import { useReservationModal } from '@/composables/useReservationModal'
import type { SortedBranch } from '../types'

const props = defineProps<{
  branches: SortedBranch[]
  highlightedId?: string
}>()

const emit = defineEmits<{
  'branch-select': [id: string]
}>()

const { t } = useI18n()
const { openReservation } = useReservationModal()

function onReserve(id: string) {
  openReservation()
  emit('branch-select', id)
}

function onCall(phone: string) {
  window.location.href = `tel:${phone}`
}
</script>

<template>
  <div>
    <p
      v-if="branches.length === 0"
      data-testid="empty-state"
      class="py-8 text-center font-body text-soft"
    >
      {{ t('branches.list.empty') }}
    </p>

    <ul v-else class="flex flex-col gap-4">
      <li
        v-for="branch in branches"
        :key="branch.id"
        :id="`branch-card-${branch.id}`"
        @click="emit('branch-select', branch.id)"
      >
        <BranchCard
          :branch="branch"
          :highlighted="branch.id === highlightedId"
          @reserve="onReserve(branch.id)"
          @call="onCall"
        />
      </li>
    </ul>
  </div>
</template>
