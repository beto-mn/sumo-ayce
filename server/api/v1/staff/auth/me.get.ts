import { eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { branches } from '../../../../db/schema'
import { db } from '../../../../utils/db'
import { handleError } from '../../../../utils/error-handler'
import { ok } from '../../../../utils/response'
import { requireStaffAuth } from '../../../../utils/staff-auth'

export default defineEventHandler(async event => {
  try {
    const staffUser = await requireStaffAuth(event)

    const [branch] = await db
      .select({ name: branches.name })
      .from(branches)
      .where(eq(branches.id, staffUser.branchId))
      .limit(1)

    return ok({
      id: staffUser.id,
      name: staffUser.name,
      role: staffUser.role,
      branchId: staffUser.branchId,
      branchName: branch?.name ?? null,
    })
  } catch (err) {
    throw handleError(err)
  }
})
