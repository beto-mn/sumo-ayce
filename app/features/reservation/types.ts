// app/features/reservation/types.ts

export interface BranchScheduleSlot {
  open: string
  close: string
}

export interface BranchSchedule {
  mon: BranchScheduleSlot | null
  tue: BranchScheduleSlot | null
  wed: BranchScheduleSlot | null
  thu: BranchScheduleSlot | null
  fri: BranchScheduleSlot | null
  sat: BranchScheduleSlot | null
  sun: BranchScheduleSlot | null
}

export interface Branch {
  id: string
  name: string
  type: 'ayce' | 'express'
  schedule: BranchSchedule | null
}

export interface ReservationDraft {
  branchId: string | null
  tipo: 'ayce' | 'express'
  date: string
  time: string
  partySize: number | null
  name: string
  phone: string
}

export interface ReservationConfirmation {
  folio: string
  branchName: string
  date: string
  time: string
  partySize: number
}

export interface CreateReservationPayload {
  branchId: string
  contactName: string
  contactPhone: string
  partySize: number
  reservationDate: string
  reservationTime: string
}

export type FormScreen = 'form' | 'confirmation'
export type FormStatus = 'idle' | 'submitting' | 'success' | 'error'
