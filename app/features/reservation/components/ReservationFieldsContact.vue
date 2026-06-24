<script setup lang="ts">
defineProps<{
  name: string
  partySize: number | null
  phone: string
  partySizeOptions: { value: string; label: string }[]
  errorName: string | undefined
  errorPartySize: string | undefined
  errorPhone: string | undefined
  isSubmitting: boolean
  nameDisabled: boolean
}>()

const emit = defineEmits<{
  'update:name': [value: string]
  'update:partySize': [value: number]
  'update:phone': [value: string]
  'field-edit': []
}>()

const { t } = useI18n()
</script>

<template>
  <!-- Row 3: Nombre completo -->
  <div class="flex flex-col gap-1.5">
    <label
      for="name-input"
      class="font-disp text-kicker uppercase text-ink"
    >
      {{ t('reservation.form.label.name') }}<span class="text-pink"> *</span>
    </label>
    <input
      id="name-input"
      :value="name"
      data-testid="name-input"
      type="text"
      name="name"
      maxlength="100"
      required
      :disabled="nameDisabled"
      class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink placeholder:text-soft transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      :class="{ 'border-pink': errorName }"
      :aria-describedby="errorName ? 'error-name' : undefined"
      :aria-invalid="errorName ? 'true' : undefined"
      @input="e => { emit('update:name', (e.target as HTMLInputElement).value); emit('field-edit') }"
    />
    <p
      v-if="errorName"
      id="error-name"
      data-testid="error-name"
      class="text-sm text-pink"
    >
      {{ t(errorName) }}
    </p>
  </div>

  <!-- Row 4: Personas + WhatsApp -->
  <div class="grid grid-cols-1 gap-4 min-[520px]:grid-cols-2">
    <div class="flex flex-col gap-1.5">
      <label
        for="party-size-select"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.party_size') }}<span class="text-pink"> *</span>
      </label>
      <select
        id="party-size-select"
        data-testid="party-size-select"
        name="partySize"
        :value="partySize ?? ''"
        :disabled="isSubmitting"
        class="w-full appearance-none rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 pr-10 font-body text-ink transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        :class="{ 'border-pink': errorPartySize }"
        :aria-describedby="errorPartySize ? 'error-party-size' : undefined"
        :aria-invalid="errorPartySize ? 'true' : undefined"
        @change="e => { emit('update:partySize', parseInt((e.target as HTMLSelectElement).value, 10)); emit('field-edit') }"
      >
        <option value="" disabled>–</option>
        <option v-for="opt in partySizeOptions" :key="opt.value" :value="opt.value">
          {{ opt.label }}
        </option>
      </select>
      <p
        v-if="errorPartySize"
        id="error-party-size"
        data-testid="error-party-size"
        class="text-sm text-pink"
      >
        {{ t(errorPartySize) }}
      </p>
    </div>

    <div class="flex flex-col gap-1.5">
      <label
        for="phone-input"
        class="font-disp text-kicker uppercase text-ink"
      >
        {{ t('reservation.form.label.phone') }}<span class="text-pink"> *</span>
      </label>
      <input
        id="phone-input"
        :value="phone"
        data-testid="phone-input"
        type="tel"
        name="phone"
        required
        :disabled="isSubmitting"
        class="w-full rounded-pop-sm border-pop-sm border-ink bg-panel px-4 py-3 font-body text-ink placeholder:text-soft transition-shadow duration-150 focus:outline-none focus:shadow-pop-sm disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
        :class="{ 'border-pink': errorPhone }"
        :aria-describedby="errorPhone ? 'error-phone' : undefined"
        :aria-invalid="errorPhone ? 'true' : undefined"
        @input="e => { emit('update:phone', (e.target as HTMLInputElement).value); emit('field-edit') }"
      />
      <p
        v-if="errorPhone"
        id="error-phone"
        data-testid="error-phone"
        class="text-sm text-pink"
      >
        {{ t(errorPhone) }}
      </p>
    </div>
  </div>
</template>
