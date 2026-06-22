<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CpState, GeoState } from '../types'

const props = defineProps<{
  geoState: GeoState
  cpState: CpState
  activeCp?: string | null
}>()

const emit = defineEmits<{
  'request-geo': []
  'cp-submit': [cp: string]
  'clear-cp': []
  'clear-geo': []
}>()

const { t } = useI18n()
const cpValue = ref('')

// Clear the input when the composable signals success (cpState.value reset to '')
watch(
  () => props.cpState.value,
  v => {
    cpValue.value = v
  }
)

function onCpSubmit() {
  emit('cp-submit', cpValue.value.trim())
}
</script>

<template>
  <div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
    <!-- Geo badge (shown when geo is active) -->
    <span
      v-if="geoState.status === 'success'"
      data-testid="geo-badge"
      class="inline-flex w-full items-center gap-1 rounded-pop-full border-pop border-ink bg-orange px-4 py-2 font-disp font-extrabold text-sm text-white shadow-pop-sm sm:w-auto"
    >
      <span aria-hidden="true">📍</span>
      {{ t('branches.search.geoButton') }}
      <button
        data-testid="geo-badge-clear"
        type="button"
        class="ml-1 flex h-5 w-5 items-center justify-center rounded-pop-full border border-ink bg-panel text-xs leading-none text-ink transition-colors hover:bg-bg2"
        :aria-label="t('branches.search.geoClear')"
        @click="emit('clear-geo')"
      >
        ×
      </button>
    </span>

    <!-- Geolocation button (hidden when unsupported or active) -->
    <button
      v-else-if="geoState.status !== 'unsupported'"
      data-testid="geo-button"
      type="button"
      :disabled="geoState.status === 'loading'"
      :aria-busy="geoState.status === 'loading' || undefined"
      class="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-pop-full border-pop border-ink bg-accent px-5 py-2 font-disp font-extrabold text-sm text-white shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop disabled:cursor-wait disabled:opacity-70 sm:w-auto"
      @click="emit('request-geo')"
    >
      <span aria-hidden="true">📍</span>
      <span
        v-if="geoState.status === 'loading'"
        class="inline-block h-3 w-3 animate-spin rounded-pop-full border-2 border-bg border-t-transparent"
        aria-hidden="true"
      />
      {{ geoState.status === 'loading' ? t('branches.search.geoLoading') : t('branches.search.geoButton') }}
    </button>

    <!-- CP badge (shown when an active CP search is in place) -->
    <span
      v-if="activeCp"
      data-testid="cp-badge"
      class="inline-flex items-center gap-1 rounded-pop-full border-pop border-ink bg-yellow px-4 py-2 font-disp font-extrabold text-sm text-ink shadow-pop-sm"
    >
      {{ activeCp }}
      <button
        data-testid="cp-badge-clear"
        type="button"
        class="ml-1 flex h-5 w-5 items-center justify-center rounded-pop-full border border-ink bg-panel text-xs leading-none transition-colors hover:bg-bg2"
        :aria-label="t('branches.search.cpClear')"
        @click="emit('clear-cp')"
      >
        ×
      </button>
    </span>

    <!-- CP form (always visible when no badge, or hidden while badge is shown) -->
    <form
      v-if="!activeCp"
      data-testid="cp-form"
      class="flex gap-2"
      @submit.prevent="onCpSubmit"
    >
      <input
        v-model="cpValue"
        data-testid="cp-input"
        type="text"
        inputmode="numeric"
        maxlength="5"
        :placeholder="t('branches.search.cpPlaceholder')"
        :aria-label="t('branches.search.cpPlaceholder')"
        class="min-h-[44px] flex-1 rounded-pop-full border-pop border-ink bg-panel px-4 py-2 font-body text-sm text-ink placeholder:text-soft focus:outline-none focus:shadow-pop-sm sm:w-[150px] sm:flex-none"
      />
      <button
        type="submit"
        class="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-pop-full border-pop border-ink bg-panel px-5 py-2 font-disp font-extrabold text-sm text-ink shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop"
        :disabled="cpState.status === 'loading'"
      >
        {{ t('branches.search.cpButton') }}
      </button>
    </form>

    <!-- Inline error messages -->
    <p
      v-if="geoState.status === 'error' && geoState.errorMessage"
      class="w-full text-sm text-pink"
      role="alert"
    >
      {{ t(geoState.errorMessage!) }}
    </p>
    <p
      v-if="cpState.status === 'error' && cpState.errorMessage"
      class="w-full text-sm text-pink"
      role="alert"
    >
      {{ t(cpState.errorMessage!) }}
    </p>
  </div>
</template>
