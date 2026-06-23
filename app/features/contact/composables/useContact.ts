import { computed, reactive } from 'vue'
import type { BranchPublicRow } from '@/types/branches'
import type { ContactBranch, ContactFormState } from '../types'

export const state = reactive<ContactFormState>({
  name: '',
  branchId: '',
  message: '',
})

export const isFormValid = computed(
  () =>
    state.name.trim().length > 0 &&
    state.branchId.trim().length > 0 &&
    state.message.trim().length > 0
)

export function buildWaUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
}

export function buildMessageText(
  formState: ContactFormState,
  waMessageTemplate: string
): string {
  return waMessageTemplate
    .replace('{name}', formState.name)
    .replace('{message}', formState.message)
}

export function filterAndSortBranches(raw: BranchPublicRow[]): ContactBranch[] {
  return raw
    .filter((b): b is BranchPublicRow & { phone: string } => b.phone !== null)
    .sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    )
    .map(b => ({ id: b.id, name: b.name, phone: b.phone }))
}

export function useContact() {
  return {
    state,
    isFormValid,
    buildWaUrl,
    buildMessageText,
    filterAndSortBranches,
  }
}
