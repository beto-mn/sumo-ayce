<script setup lang="ts">
defineProps<{
  tipo: 'ayce' | 'express'
  branchId: string | null
  branchOptions: { value: string; label: string }[]
  tipoOptions: { value: string; label: string }[]
  errorBranch: string | undefined
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  'update:tipo': [value: 'ayce' | 'express']
  'update:branchId': [value: string | null]
  'field-edit': []
}>()

const { t } = useI18n()
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <label
        for="tipo-select"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.tipo') }}<span class="text-pink"> *</span>
      </label>
      <select
        id="tipo-select"
        :value="tipo"
        data-testid="tipo-select"
        name="tipo"
        :disabled="isSubmitting"
        class="w-full appearance-none rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 pr-10 font-body text-ink transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        @change="e => { emit('update:tipo', (e.target as HTMLSelectElement).value as 'ayce' | 'express'); emit('field-edit') }"
      >
        <option v-for="opt in tipoOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
    </div>

    <div class="flex flex-col gap-1.5">
      <label
        for="branch-select"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.branch') }}<span class="text-pink"> *</span>
      </label>
      <select
        id="branch-select"
        :value="branchId ?? ''"
        data-testid="branch-select"
        name="branchId"
        required
        :disabled="isSubmitting"
        class="w-full appearance-none rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 pr-10 font-body text-ink transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        :aria-describedby="errorBranch ? 'error-branch' : undefined"
        :aria-invalid="errorBranch ? 'true' : undefined"
        @change="e => { const v = (e.target as HTMLSelectElement).value; emit('update:branchId', v || null); emit('field-edit') }"
      >
        <option value="" disabled>{{ t('reservation.form.placeholder.branch') }}</option>
        <option v-for="opt in branchOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <p
        v-if="errorBranch"
        id="error-branch"
        data-testid="error-branch"
        class="text-sm text-pink"
      >
        {{ t(errorBranch) }}
      </p>
    </div>
  </div>
</template>
