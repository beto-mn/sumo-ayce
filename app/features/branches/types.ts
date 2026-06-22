// app/features/branches/types.ts

import type { BranchPublicRow, BranchWithDistance } from '@/types/branches'

export type { BranchPublicRow, BranchWithDistance }

export type SortedBranch = BranchPublicRow & { distanceKm?: number }

export interface GeoState {
  status: 'idle' | 'loading' | 'success' | 'error' | 'unsupported'
  errorMessage: string | null
  userLat: number | null
  userLng: number | null
}

export interface CpState {
  value: string // raw input
  status: 'idle' | 'loading' | 'success' | 'error'
  errorMessage: string | null
}
