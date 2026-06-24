// types/branches.ts

export interface BranchScheduleSlot {
  open: string // e.g. "12:00"
  close: string // e.g. "22:00"
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

/** Public branch row returned by GET /api/v1/branches */
export interface BranchPublicRow {
  id: string
  name: string
  address: string
  lat: string | null
  lng: string | null
  isActive: boolean
  type: 'ayce' | 'express'
  schedule: BranchSchedule | null
  phone: string | null // whatsappReservaciones renamed
}

/** Branch with client-computed distance (only when coordinates are provided) */
export interface BranchWithDistance extends BranchPublicRow {
  distanceKm: number
}

/** SearchContext included in the response when coordinates are provided (feature 004) */
export interface SearchContext {
  radiusUsed: number
  expanded: boolean
  noResults: boolean
}

/** Response from GET /api/v1/branches without coordinates */
export interface BranchesResponse {
  data: BranchPublicRow[]
  error: null
  meta: null
}

/** Response from GET /api/v1/branches with coordinates */
export interface BranchesWithDistanceResponse {
  data: BranchWithDistance[]
  error: null
  meta: null
  searchContext: SearchContext
}
