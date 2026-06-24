<script setup lang="ts">
import { computed, watch } from 'vue'
import { useReservationDerived } from '../composables/useReservationDerived'
import { useReservationSubmit } from '../composables/useReservationSubmit'
import type { Branch } from '../types'
import ReservationFieldsContact from './ReservationFieldsContact.vue'
import ReservationFieldsDateTime from './ReservationFieldsDateTime.vue'
import ReservationFieldsPrimary from './ReservationFieldsPrimary.vue'

const props = defineProps<{
  branches: Branch[]
  initialBranchId?: string
  initialTipo?: 'ayce' | 'express'
}>()

const { t } = useI18n()

const {
  draft,
  errors,
  status,
  confirmationData,
  apiError,
  submit,
  resetForm,
  clearErrorOnEdit,
} = useReservationSubmit(props.branches)

const resolvedInitialBranch = props.branches.find(
  b => b.id === props.initialBranchId
)
draft.branchId = resolvedInitialBranch?.id ?? null
draft.tipo =
  props.initialTipo === 'express' || props.initialTipo === 'ayce'
    ? props.initialTipo
    : 'ayce'

const {
  scheduleForDate,
  horaMin,
  horaMax,
  todayIso,
  maxDateIso,
  branchOptions,
  accentStyle,
} = useReservationDerived(draft, props.branches)

watch(
  () => draft.date,
  () => {
    draft.time = ''
  }
)
watch(
  () => draft.branchId,
  () => {
    draft.time = ''
  }
)
watch(
  () => draft.tipo,
  () => {
    draft.branchId = null
    draft.time = ''
  }
)

const tipoOptions = [
  { value: 'ayce', label: 'All You Can Eat' },
  { value: 'express', label: 'Express' },
]
const partySizeOptions = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}))
const isSubmitting = computed(() => status.value === 'submitting')
const showConfirmation = computed(() => status.value === 'success')
const timeSelectDisabled = computed(
  () => !draft.branchId || !draft.date || isSubmitting.value
)

function onFieldEdit() {
  clearErrorOnEdit()
}
function onReset() {
  resetForm()
}
</script>

<template>
  <div data-testid="form-wrapper" :style="accentStyle">
    <ReservationConfirmation
      v-if="showConfirmation && confirmationData"
      :confirmation="confirmationData"
      @reset="onReset"
    />

    <form
      v-else
      data-testid="reservation-form"
      class="flex flex-col gap-5"
      novalidate
      @submit.prevent="submit"
    >
      <div
        v-if="apiError"
        data-testid="api-error"
        role="alert"
        class="rounded-pop-sm border-pop-sm border-pink bg-panel px-4 py-3 font-body text-sm text-pink"
      >
        {{ t(apiError) }}
      </div>

      <ReservationFieldsPrimary
        :tipo="draft.tipo"
        :branch-id="draft.branchId"
        :branch-options="branchOptions"
        :tipo-options="tipoOptions"
        :error-branch="errors.branch"
        :is-submitting="isSubmitting"
        @update:tipo="draft.tipo = $event"
        @update:branch-id="draft.branchId = $event"
        @field-edit="onFieldEdit"
      />

      <ReservationFieldsDateTime
        :date="draft.date"
        :time="draft.time"
        :today-iso="todayIso"
        :max-date-iso="maxDateIso"
        :hora-min="horaMin"
        :hora-max="horaMax"
        :schedule-for-date="scheduleForDate"
        :error-date="errors.date"
        :error-time="errors.time"
        :is-submitting="isSubmitting"
        :date-disabled="!draft.branchId || isSubmitting"
        :time-disabled="timeSelectDisabled"
        :branch-id="draft.branchId"
        @update:date="draft.date = $event"
        @update:time="draft.time = $event"
        @field-edit="onFieldEdit"
      />

      <ReservationFieldsContact
        :name="draft.name"
        :party-size="draft.partySize"
        :phone="draft.phone"
        :party-size-options="partySizeOptions"
        :error-name="errors.name"
        :error-party-size="errors.partySize"
        :error-phone="errors.phone"
        :is-submitting="isSubmitting"
        :name-disabled="!draft.branchId || isSubmitting"
        @update:name="draft.name = $event"
        @update:party-size="draft.partySize = $event"
        @update:phone="draft.phone = $event"
        @field-edit="onFieldEdit"
      />

      <UiButton
        data-testid="submit-button"
        type="submit"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        :aria-busy="isSubmitting || undefined"
        class="w-full sm:w-auto"
      >
        {{
          isSubmitting ? t('reservation.form.submitting') : t('reservation.form.submit')
        }}
      </UiButton>
    </form>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
</style>
