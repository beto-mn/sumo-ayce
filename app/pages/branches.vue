<script setup lang="ts">
import { computed, ref } from 'vue'
import type { LngLat, MapMarker } from '@/composables/maps/types'
import { useBranches } from '@/features/branches/composables/useBranches'
import type { SortedBranch } from '@/features/branches/types'

const { t } = useI18n()

useSeoMeta({
  title: () => `SUMO · ${t('branches.page.title')}`,
  description: () => t('branches.page.description'),
  ogTitle: () => `SUMO · ${t('branches.page.title')}`,
  ogDescription: () => t('branches.page.description'),
})

const {
  branches,
  isLoading,
  geoState,
  cpState,
  activeCpBadge,
  highlightedBranchId,
  fetchBranches,
  requestGeolocation,
  geocodePostalCode,
  clearCpSearch,
  clearGeoSearch,
} = useBranches()

// ISR: pre-render the full branch list at revalidation time
const { data: initialData } = await useAsyncData('branches', () =>
  $fetch<{ data: SortedBranch[] }>('/api/v1/branches')
)
if (initialData.value?.data) {
  branches.value = initialData.value.data
}

// Type filter: all | ayce | express
const activeFilter = ref<'all' | 'ayce' | 'express'>('all')
const filterOptions = [
  { value: 'all' as const, label: () => t('branches.filter.all') },
  { value: 'ayce' as const, label: () => t('branches.filter.ayce') },
  { value: 'express' as const, label: () => t('branches.filter.express') },
]

const filteredBranches = computed(() =>
  activeFilter.value === 'all'
    ? branches.value
    : branches.value.filter((b: SortedBranch) => b.type === activeFilter.value)
)

const mapRef = ref<{
  flyTo: (pos: LngLat, zoom?: number) => void
  highlightPin: (id: string) => void
  fitMarkers: (markers: MapMarker[]) => void
} | null>(null)

const listRef = ref<HTMLElement | null>(null)

const mapMarkers = computed<MapMarker[]>(() =>
  filteredBranches.value
    .filter((b: SortedBranch) => b.lat != null && b.lng != null)
    .map((b: SortedBranch) => ({
      id: b.id,
      position: [
        parseFloat(b.lng as string),
        parseFloat(b.lat as string),
      ] as LngLat,
      color: b.type === 'express' ? ('blue' as const) : ('orange' as const),
      popupContent: b.name,
    }))
)

function onMarkerClick(id: string) {
  highlightedBranchId.value = id
  const card = document.getElementById(`branch-card-${id}`)
  const container = listRef.value
  if (!card || !container) return
  const cardRect = card.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const offset =
    cardRect.top -
    containerRect.top -
    (container.clientHeight - card.offsetHeight) / 2
  container.scrollBy({ top: offset, behavior: 'smooth' })
}

function onBranchSelect(id: string) {
  highlightedBranchId.value = id
  const branch = filteredBranches.value.find((b: SortedBranch) => b.id === id)
  if (
    branch?.lat &&
    branch?.lng &&
    mapRef.value &&
    typeof mapRef.value.flyTo === 'function'
  ) {
    mapRef.value.flyTo([parseFloat(branch.lng), parseFloat(branch.lat)], 15)
    mapRef.value.highlightPin(id)
  }
}

async function onCpSubmit(cp: string) {
  highlightedBranchId.value = null
  if (!cp) {
    mapRef.value?.fitMarkers(mapMarkers.value)
    return
  }
  if (cp !== activeCpBadge.value) {
    await geocodePostalCode(cp)
  }
  mapRef.value?.fitMarkers(mapMarkers.value)
}

const CDMX_CENTER: LngLat = [-99.1332, 19.4326]
</script>

<template>
  <div class="min-h-screen bg-bg px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-7xl">
      <!-- Page header -->
      <UiPageHeader
        :badge="t('branches.page.kicker')"
        badge-tone="ink"
        :title="t('branches.page.heading')"
      />

      <!-- Search + filter controls -->
      <div class="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <!-- Search controls (geo + CP) -->
        <BranchSearch
          :geo-state="geoState"
          :cp-state="cpState"
          :active-cp="activeCpBadge"
          @request-geo="requestGeolocation"
          @cp-submit="onCpSubmit"
          @clear-cp="clearCpSearch"
          @clear-geo="clearGeoSearch"
        />

        <!-- Type filter tabs: full-width on mobile/tablet, auto + right-push on desktop -->
        <div class="w-full sm:w-auto sm:self-start lg:ml-auto rounded-pop-full shadow-pop">
          <div class="flex overflow-hidden rounded-pop-full border-pop border-ink">
            <button
              v-for="opt in filterOptions"
              :key="opt.value"
              type="button"
              :data-on="activeFilter === opt.value"
              :class="[
                'flex-1 sm:flex-none min-h-[44px] px-5 py-2 font-disp font-extrabold text-sm transition-colors',
                activeFilter === opt.value && opt.value === 'ayce'
                  ? 'bg-orange text-white'
                  : activeFilter === opt.value && opt.value === 'express'
                    ? 'bg-blue text-white'
                    : activeFilter === opt.value
                      ? 'bg-ink text-bg'
                      : 'bg-panel text-ink hover:bg-bg2',
              ]"
              @click="activeFilter = opt.value"
            >
              {{ opt.label() }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="mt-6 flex justify-center py-12">
        <span class="inline-block h-8 w-8 animate-spin rounded-pop-full border-4 border-accent border-t-transparent" aria-label="Cargando..." />
      </div>

      <!-- Main grid: map LEFT (1.1fr), list RIGHT (0.9fr) — single column on mobile -->
      <div v-else class="mt-6 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <!-- Map panel -->
        <div
          data-testid="map-panel"
          class="h-[340px] overflow-hidden rounded-pop border-pop border-ink shadow-pop lg:h-[560px] lg:sticky lg:top-6"
        >
          <ClientOnly>
            <UiMapView
              ref="mapRef"
              :center="CDMX_CENTER"
              :zoom="11"
              :markers="mapMarkers"
              map-style="streets"
              :interactive="true"
              @marker-click="onMarkerClick"
            >
              <template #fallback>
                <div class="flex h-full items-center justify-center p-6 text-center">
                  <p class="font-body text-soft">{{ t('branches.map.unavailable') }}</p>
                </div>
              </template>
            </UiMapView>
          </ClientOnly>
        </div>

        <!-- Branch list (right, scrollable) -->
        <div ref="listRef" class="flex flex-col gap-4 lg:max-h-[560px] lg:overflow-y-auto lg:p-3">
          <BranchList
            :branches="filteredBranches"
            :highlighted-id="highlightedBranchId ?? undefined"
            @branch-select="onBranchSelect"
          />
        </div>
      </div>
    </div>
  </div>
</template>
