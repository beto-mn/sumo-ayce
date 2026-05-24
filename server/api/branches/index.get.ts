import { asc, eq } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { branches } from '../../db/schema'
import { db } from '../../utils/db'
import { ok } from '../../utils/response'

export default defineEventHandler(async () => {
  const rows = await db
    .select({
      id: branches.id,
      name: branches.name,
      address: branches.address,
      postalCode: branches.postalCode,
    })
    .from(branches)
    .where(eq(branches.isActive, true))
    .orderBy(asc(branches.name))

  return ok(rows)
})
