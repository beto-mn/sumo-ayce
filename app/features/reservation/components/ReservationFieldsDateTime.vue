<script setup lang="ts">
import type { BranchScheduleSlot } from '../types'

defineProps<{
  date: string
  time: string
  todayIso: string
  maxDateIso: string
  horaMin: string
  horaMax: string
  scheduleForDate: BranchScheduleSlot | null
  errorDate: string | undefined
  errorTime: string | undefined
  isSubmitting: boolean
  dateDisabled: boolean
  timeDisabled: boolean
  branchId: string | null
}>()

const emit = defineEmits<{
  'update:date': [value: string]
  'update:time': [value: string]
  'field-edit': []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <label
        for="date-input"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.date') }}<span class="text-pink"> *</span>
      </label>
      <input
        id="date-input"
        :value="date"
        data-testid="date-input"
        type="date"
        name="date"
        :min="todayIso"
        :max="maxDateIso"
        required
        :disabled="dateDisabled"
        class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        :class="{ 'border-pink': errorDate }"
        :aria-describedby="errorDate ? 'error-date' : undefined"
        :aria-invalid="errorDate ? 'true' : undefined"
        @input="e => { emit('update:date', (e.target as HTMLInputElement).value); emit('field-edit') }"
      />
      <p
        v-if="errorDate"
        id="error-date"
        data-testid="error-date"
        class="text-sm text-pink"
      >
        {{ t(errorDate) }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label
        for="time-input"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.time') }}<span class="text-pink"> *</span>
      </label>
      <input
        id="time-input"
        :value="time"
        data-testid="time-input"
        type="time"
        name="time"
        :min="horaMin"
        :max="horaMax"
        step="900"
        :disabled="timeDisabled"
        class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        :class="{ 'border-pink': errorTime }"
        :aria-describedby="errorTime ? 'error-time' : undefined"
        :aria-invalid="errorTime ? 'true' : undefined"
        @input="e => { emit('update:time', (e.target as HTMLInputElement).value); emit('field-edit') }"
      />
      <p
        v-if="scheduleForDate && !errorTime"
        data-testid="schedule-hint"
        class="text-xs text-soft font-body"
      >
        {{ scheduleForDate.open }} – {{ scheduleForDate.close }}
        · {{ t('reservation.form.placeholder.last_slot') }} {{ horaMax }}
      </p>
      <p
        v-if="!branchId && !errorTime"
        data-testid="hint-no-branch"
        class="text-xs text-soft font-body"
      >
        {{ t('reservation.form.placeholder.time_no_branch') }}
      </p>
      <p
        v-if="branchId && date && !scheduleForDate && !errorTime"
        data-testid="hint-no-schedule"
        class="text-xs text-soft font-body"
      >
        {{ t('reservation.form.placeholder.time_no_schedule') }}
      </p>
      <p
        v-if="errorTime"
        id="error-time"
        data-testid="error-time"
        class="text-sm text-pink"
      >
        {{ t(errorTime) }}
      </p>
    </div>
  </div>
</template>
