export type StaffRole = 'staff' | 'admin' | 'owner'

export interface StaffUser {
  id: string
  name: string
  email: string
  role: StaffRole
  branchId: string
  branchName: string | null
  isActive: boolean
}

export interface StaffSession {
  staffUser: StaffUser
  expiresAt: Date
}

export const ROLE_RANK: Record<StaffRole, number> = {
  staff: 1,
  admin: 2,
  owner: 3,
}
