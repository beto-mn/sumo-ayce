<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import type { LngLat, MapMarker, MapViewProps } from '@/composables/maps/types'
import { useMapProvider } from '@/composables/maps/useMapProvider'

const props = withDefaults(defineProps<MapViewProps>(), {
  mapStyle: 'streets',
  interactive: true,
})

const emit = defineEmits<{
  'marker-click': [id: string]
}>()

const adapter = useMapProvider()
const mapContainer = ref<HTMLElement | null>(null)
const mapInstance = ref<unknown>(null)
const hasError = ref(false)
const runtimeConfig = useRuntimeConfig()

async function initMap() {
  if (!mapContainer.value) return
  try {
    mapInstance.value = await adapter.createMap(mapContainer.value, {
      center: props.center,
      zoom: props.zoom,
      style: props.mapStyle ?? 'streets',
      accessToken: runtimeConfig.public.mapboxAccessToken as string,
    })
    syncMarkers()
  } catch {
    hasError.value = true
  }
}

function syncMarkers() {
  if (!mapInstance.value) return
  for (const marker of props.markers) {
    const markerWithClick: MapMarker = {
      ...marker,
      onClick: () => emit('marker-click', marker.id),
    }
    adapter.addMarker(mapInstance.value, markerWithClick)
  }
  if (props.markers.length > 0) {
    adapter.fitBounds(mapInstance.value, props.markers)
  }
}

watch(
  () => props.markers,
  (newMarkers, oldMarkers) => {
    if (!mapInstance.value) return
    const oldIds = new Set((oldMarkers ?? []).map(m => m.id))
    const newIds = new Set(newMarkers.map(m => m.id))

    for (const id of oldIds) {
      if (!newIds.has(id)) adapter.removeMarker(mapInstance.value, id)
    }
    for (const marker of newMarkers) {
      if (!oldIds.has(marker.id)) {
        const m: MapMarker = {
          ...marker,
          onClick: () => emit('marker-click', marker.id),
        }
        adapter.addMarker(mapInstance.value, m)
      }
    }
    if (newMarkers.length > 0) {
      adapter.fitBounds(mapInstance.value, newMarkers)
    }
  },
  { deep: true }
)

onMounted(() => {
  initMap()
})

onUnmounted(() => {
  if (mapInstance.value) {
    adapter.destroy(mapInstance.value)
    mapInstance.value = null
  }
})

/** Expose methods for parent to call (map↔list cross-link) */
defineExpose({
  flyTo(position: LngLat, zoom?: number) {
    if (!mapInstance.value) return
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    if (reducedMotion) {
      adapter.setCenter(mapInstance.value, position)
      if (zoom != null) adapter.setZoom(mapInstance.value, zoom)
    } else {
      adapter.flyTo(mapInstance.value, position, zoom)
    }
  },
  highlightPin(_id: string) {
    // Pin highlight state is managed via marker onClick; visual highlight
    // could be extended here in a future iteration.
  },
  fitMarkers(markers: MapMarker[]) {
    if (!mapInstance.value || markers.length === 0) return
    adapter.fitBounds(mapInstance.value, markers)
  },
})
</script>

<template>
  <div class="relative h-full w-full">
    <div
      v-if="!hasError"
      ref="mapContainer"
      class="h-full w-full"
      role="application"
      aria-label="SUMO branch map"
    />
    <div
      v-else
      class="flex h-full w-full items-center justify-center bg-panel p-6 text-center font-body text-soft"
    >
      <slot name="fallback">
        <p>Mapa no disponible</p>
      </slot>
    </div>
  </div>
</template>
