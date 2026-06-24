<script setup lang="ts">
import type { Branch } from '@/features/reservation/types'
import type { BranchPublicRow } from '@/types/branches'

const { t } = useI18n()
const route = useRoute()
const localePath = useLocalePath()

const {
  data: branchesData,
  error: branchesError,
  refresh,
} = await useAsyncData('reservation-branches', () =>
  $fetch<{ data: BranchPublicRow[] }>('/api/v1/branches')
)

const branches = computed<Branch[]>(() => {
  if (!branchesData.value?.data) return []
  return branchesData.value.data.map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    schedule: b.schedule,
  }))
})

const initialBranchId = computed<string | undefined>(() => {
  const raw = route.query.branch
  const val = Array.isArray(raw) ? raw[0] : raw
  if (!val || typeof val !== 'string') return undefined
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidPattern.test(val) ? val : undefined
})

const initialTipo = computed<'ayce' | 'express' | undefined>(() => {
  const raw = route.query.type
  const val = Array.isArray(raw) ? raw[0] : raw
  if (val === 'ayce' || val === 'express') return val
  return undefined
})

useSeoMeta({
  title: () => t('reservation.page_title'),
})
</script>

<template>
  <div class="container-pop py-10">
    <div class="max-w-2xl mx-auto">
      <UiPageHeader
        :badge="t('nav.reserve')"
        :title="t('reservation.page_title')"
      />

      <div v-if="branchesError" class="mt-6 rounded-pop-sm border-pop-sm border-pink bg-panel px-4 py-3 font-body text-sm text-pink">
        {{ t('reservation.error.api_generic') }}
        <button
          type="button"
          class="ml-2 underline"
          @click="refresh()"
        >
          {{ t('common.cta.reserve') }}
        </button>
      </div>

      <ReservationForm
        v-else
        class="mt-8"
        :branches="branches"
        :initial-branch-id="initialBranchId"
        :initial-tipo="initialTipo"
      />
    </div>
  </div>
</template>
