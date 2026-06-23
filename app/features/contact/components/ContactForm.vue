<script setup lang="ts">
import { computed, watch } from 'vue'
import {
  buildWaUrl,
  filterAndSortBranches,
  isFormValid,
  state,
} from '../composables/useContact'
import type { ContactBranch } from '../types'

const { t } = useI18n()

const emit = defineEmits<{
  'update:selectedBranch': [branch: ContactBranch | null]
}>()

const { data, pending, error } = useFetch('/api/v1/branches', { server: false })

const filteredBranches = computed(() => {
  if (!data.value?.data) return []
  return filterAndSortBranches(data.value.data)
})

const hasBranches = computed(() => filteredBranches.value.length > 0)

const isCtaDisabled = computed(
  () =>
    !isFormValid.value || pending.value || !!error.value || !hasBranches.value
)

watch(
  () => state.branchId,
  newId => {
    if (!newId) {
      emit('update:selectedBranch', null)
      return
    }
    const branch = filteredBranches.value.find(b => b.id === newId) ?? null
    emit('update:selectedBranch', branch)
  }
)

function onSubmit() {
  if (isCtaDisabled.value) return
  const branch = filteredBranches.value.find(b => b.id === state.branchId)
  if (!branch) return
  const text = t('contact.waMessage', {
    name: state.name,
    message: state.message,
  })
  const url = buildWaUrl(branch.phone, text)
  window.open(url, '_blank')
}
</script>

<template>
  <div class="rounded-pop border-pop border-ink shadow-pop bg-panel p-6">
    <h2 class="font-disp text-h-sm font-extrabold text-ink mb-6">
      {{ t('contact.form.title') }}
    </h2>

    <form class="flex flex-col gap-5" @submit.prevent="onSubmit">
      <!-- Name field -->
      <div class="flex flex-col gap-1.5">
        <label
          for="contact-name"
          class="font-disp text-kicker uppercase text-ink"
        >
          {{ t('contact.form.name.label') }}<span class="text-pink"> *</span>
        </label>
        <input
          id="contact-name"
          v-model="state.name"
          type="text"
          name="contact-name"
          :placeholder="t('contact.form.name.placeholder')"
          required
          aria-required="true"
          data-testid="name-input"
          class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink placeholder:text-soft transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm min-h-[44px]"
        />
      </div>

      <!-- Branch select -->
      <div class="flex flex-col gap-1.5">
        <label
          for="contact-branch"
          class="font-disp text-kicker uppercase text-ink"
        >
          {{ t('contact.form.branch.label') }}<span class="text-pink"> *</span>
        </label>

        <div v-if="pending" data-testid="loading-indicator" class="flex items-center gap-2 min-h-[44px] text-soft font-body">
          <span
            class="inline-block h-4 w-4 animate-spin rounded-pop-full border-2 border-accent border-t-transparent motion-reduce:animate-none"
            aria-hidden="true"
          />
          <span>{{ t('contact.form.loading') }}</span>
        </div>

        <p
          v-else-if="error"
          data-testid="fetch-error"
          class="font-body text-pink min-h-[44px] flex items-center"
        >
          {{ t('contact.form.error') }}
        </p>

        <p
          v-else-if="data && !hasBranches"
          data-testid="empty-branches"
          class="font-body text-soft min-h-[44px] flex items-center"
        >
          {{ t('contact.form.empty') }}
        </p>

        <div v-else class="relative">
          <select
            id="contact-branch"
            v-model="state.branchId"
            name="contact-branch"
            required
            aria-required="true"
            data-testid="branch-select"
            class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 pr-10 font-body text-ink appearance-none transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm min-h-[44px]"
          >
            <option value="" disabled>{{ t('contact.form.branch.placeholder') }}</option>
            <option
              v-for="branch in filteredBranches"
              :key="branch.id"
              :value="branch.id"
              data-testid="branch-option"
            >
              {{ branch.name }}
            </option>
          </select>
          <span
            class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 font-disp text-ink"
            aria-hidden="true"
          >▾</span>
        </div>
      </div>

      <!-- Message field -->
      <div class="flex flex-col gap-1.5">
        <label
          for="contact-message"
          class="font-disp text-kicker uppercase text-ink"
        >
          {{ t('contact.form.message.label') }}<span class="text-pink"> *</span>
        </label>
        <textarea
          id="contact-message"
          v-model="state.message"
          name="contact-message"
          :placeholder="t('contact.form.message.placeholder')"
          rows="4"
          required
          aria-required="true"
          data-testid="message-textarea"
          class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink placeholder:text-soft resize-y transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm min-h-[44px]"
        />
      </div>

      <!-- CTA button -->
      <button
        type="submit"
        :disabled="isCtaDisabled"
        :aria-disabled="isCtaDisabled"
        data-testid="cta-button"
        class="inline-flex items-center justify-center gap-2 rounded-pop-full border-pop border-ink font-disp font-extrabold shadow-pop-sm transition-transform duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-pop active:translate-x-0 active:translate-y-0 active:shadow-pop-sm focus-visible:outline-none focus-visible:ring-pop focus-visible:ring-accent px-6 py-[14px] text-base min-h-[50px] bg-accent text-bg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-pop-sm"
      >
        {{ t('contact.form.cta') }}
      </button>
    </form>
  </div>
</template>
