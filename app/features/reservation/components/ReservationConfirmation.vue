<script setup lang="ts">
import type { ReservationConfirmation } from '../types'

const props = defineProps<{
  confirmation: ReservationConfirmation
}>()

const emit = defineEmits<{
  reset: []
}>()

const { t } = useI18n()
</script>

<template>
  <div
    data-testid="reservation-confirmation"
    class="flex flex-col gap-6 rounded-pop border-pop border-ink bg-panel p-6 shadow-pop"
  >
    <div class="flex flex-col gap-1">
      <span
        class="inline-flex items-center self-start rounded-pop-full bg-accent px-3 py-1 font-disp font-extrabold text-kicker text-white"
      >
        {{ t('reservation.confirmation.title') }}
      </span>
    </div>

    <dl class="flex flex-col gap-3">
      <div class="flex flex-col gap-0.5">
        <dt class="font-disp text-kicker uppercase text-soft">
          {{ t('reservation.confirmation.folio_label') }}
        </dt>
        <dd
          data-testid="folio"
          class="font-disp font-extrabold text-h3 text-ink"
        >
          {{ confirmation.folio }}
        </dd>
      </div>

      <div class="flex flex-col gap-0.5">
        <dt class="font-disp text-kicker uppercase text-soft">
          {{ t('reservation.confirmation.branch_label') }}
        </dt>
        <dd data-testid="branch-name" class="font-body text-ink">
          {{ confirmation.branchName }}
        </dd>
      </div>

      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div class="flex flex-col gap-0.5">
          <dt class="font-disp text-kicker uppercase text-soft">
            {{ t('reservation.confirmation.date_label') }}
          </dt>
          <dd data-testid="conf-date" class="font-body text-ink">
            {{ confirmation.date }}
          </dd>
        </div>

        <div class="flex flex-col gap-0.5">
          <dt class="font-disp text-kicker uppercase text-soft">
            {{ t('reservation.confirmation.time_label') }}
          </dt>
          <dd data-testid="conf-time" class="font-body text-ink">
            {{ confirmation.time }}
          </dd>
        </div>

        <div class="flex flex-col gap-0.5">
          <dt class="font-disp text-kicker uppercase text-soft">
            {{ t('reservation.confirmation.party_size_label') }}
          </dt>
          <dd data-testid="conf-party-size" class="font-body text-ink">
            {{ confirmation.partySize }}
          </dd>
        </div>
      </div>
    </dl>

    <p
      data-testid="whatsapp-note"
      class="rounded-pop-sm border-pop-sm border-ink bg-cream px-4 py-3 font-body text-sm text-soft"
    >
      {{ t('reservation.confirmation.whatsapp_note') }}
    </p>

    <UiButton
      data-testid="reset-button"
      variant="ghost"
      type="button"
      @click="emit('reset')"
    >
      {{ t('reservation.confirmation.reset_button') }}
    </UiButton>
  </div>
</template>
