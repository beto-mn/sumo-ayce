import { and, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import type { StaffRole, StaffUser } from '../../types/staff'
import { ROLE_RANK } from '../../types/staff'
import { staffSessions, staffUsers } from '../db/schema'
import { db } from './db'
import { AuthError, ForbiddenError } from './error-handler'

export async function requireStaffAuth(
  event: H3Event,
  minRole?: StaffRole
): Promise<StaffUser> {
  const token = getCookie(event, 'staff_session')
  if (!token) throw new AuthError()

  const now = new Date()
  const rows = await db
    .select({
      id: staffUsers.id,
      name: staffUsers.name,
      email: staffUsers.email,
      role: staffUsers.role,
      branchId: staffUsers.branchId,
      isActive: staffUsers.isActive,
    })
    .from(staffSessions)
    .innerJoin(staffUsers, eq(staffSessions.staffUserId, staffUsers.id))
    .where(
      and(eq(staffSessions.token, token), gt(staffSessions.expiresAt, now))
    )
    .limit(1)

  const row = rows[0]
  if (!row?.isActive) throw new AuthError()

  if (minRole && ROLE_RANK[row.role as StaffRole] < ROLE_RANK[minRole]) {
    throw new ForbiddenError('Insufficient role')
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role as StaffRole,
    branchId: row.branchId ?? '',
    branchName: null,
    isActive: row.isActive,
  }
}
