import type { Ref } from 'vue'
import { reactive, ref } from 'vue'
import type {
  Branch,
  CreateReservationPayload,
  FormStatus,
  ReservationConfirmation,
  ReservationDraft,
} from '../types'
import { stripPhone, validate } from './reservationValidation'

interface FormErrors {
  branch?: string
  date?: string
  time?: string
  partySize?: string
  name?: string
  phone?: string
}

interface UseReservationSubmitReturn {
  draft: ReservationDraft
  errors: FormErrors
  status: Ref<FormStatus>
  confirmationData: Ref<ReservationConfirmation | null>
  apiError: Ref<string | null>
  submit: () => Promise<void>
  resetForm: () => void
  clearErrorOnEdit: () => void
}

function makeInitialDraft(): ReservationDraft {
  return {
    branchId: null,
    tipo: 'ayce',
    date: '',
    time: '',
    partySize: null,
    name: '',
    phone: '',
  }
}

function applyErrors(errors: FormErrors, v: ReturnType<typeof validate>): void {
  Object.assign(errors, {
    branch: v.branch,
    date: v.date,
    time: v.time,
    partySize: v.partySize,
    name: v.name,
    phone: v.phone,
  })
}

function buildPayload(draft: ReservationDraft): CreateReservationPayload {
  return {
    branchId: draft.branchId as string,
    contactName: draft.name.trim(),
    contactPhone: stripPhone(draft.phone),
    partySize: draft.partySize as number,
    reservationDate: draft.date,
    reservationTime: draft.time,
  }
}

export function useReservationSubmit(
  branches: Branch[]
): UseReservationSubmitReturn {
  const draft = reactive<ReservationDraft>(makeInitialDraft())
  const errors = reactive<FormErrors>({})
  const status = ref<FormStatus>('idle')
  const confirmationData = ref<ReservationConfirmation | null>(null)
  const apiError = ref<string | null>(null)

  async function submit(): Promise<void> {
    const validationErrors = validate(draft, branches)
    applyErrors(errors, validationErrors)
    if (Object.values(validationErrors).some(Boolean)) return

    status.value = 'submitting'
    apiError.value = null

    const branch = branches.find(b => b.id === draft.branchId)
    const payload = buildPayload(draft)

    try {
      const result = await $fetch<{ data: { folio: string } }>(
        '/api/v1/reservations',
        { method: 'POST', body: payload }
      )
      confirmationData.value = {
        folio: result.data.folio,
        branchName: branch?.name ?? '',
        date: draft.date,
        time: draft.time,
        partySize: draft.partySize as number,
      }
      status.value = 'success'
    } catch {
      status.value = 'error'
      apiError.value = 'reservation.error.api_generic'
    }
  }

  function resetForm(): void {
    Object.assign(draft, makeInitialDraft())
    Object.assign(errors, {
      branch: undefined,
      date: undefined,
      time: undefined,
      partySize: undefined,
      name: undefined,
      phone: undefined,
    })
    status.value = 'idle'
    confirmationData.value = null
    apiError.value = null
  }

  function clearErrorOnEdit(): void {
    apiError.value = null
    if (status.value === 'error') status.value = 'idle'
  }

  return {
    draft,
    errors,
    status,
    confirmationData,
    apiError,
    submit,
    resetForm,
    clearErrorOnEdit,
  }
}
